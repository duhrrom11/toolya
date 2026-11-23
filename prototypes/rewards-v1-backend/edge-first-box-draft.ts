/**
 * Toolya Rewards V1 — Supabase Edge Function DRAFT.
 *
 * NOT deployed. NOT imported by production frontend.
 * Prerequisites: reviewed staging migrations for schema-draft.sql and
 * first-box-transaction-draft.sql. JWT verification is mandatory.
 * Supports the existing 9 moving-box fields, including limited base64 photos.
 * Caller must reload CloudController.load() after successful server-side save.
 *
 * The ONLY privilege boundary for the RPC is the service-role key stored
 * as an Edge Function secret. Never copy that key to static web assets.
 */
import { createClient } from "jsr:@supabase/supabase-js@2.57.0";
import { checkFirstBoxRequest, MAX_BODY_BYTES } from "./moving-box-contract.mjs";

const allowedOrigins = new Set([
  "https://toolya.app",
  "https://www.toolya.app",
]);
const jsonHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
function respond(status: number, payload: Record<string, unknown>, origin: string | null) {
  const headers: Record<string, string> = { ...jsonHeaders, Vary: "Origin" };
  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "authorization, content-type, apikey";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  }
  return new Response(JSON.stringify(payload), { status, headers });
}
function validPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins.has(origin)) {
    return respond(403, { error: "origin_denied" }, null);
  }
  if (request.method === "OPTIONS") {
    const response = respond(200, { preflight: true }, origin);
    return new Response(null, { status: 204, headers: response.headers });
  }
  if (request.method !== "POST") return respond(405, { error: "method_not_allowed" }, origin);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return respond(401, { error: "authentication_required" }, origin);
  }
  const token = authorization.slice("Bearer ".length).trim();
  if (token.length < 25 || token.length > 8192) {
    return respond(401, { error: "invalid_token" }, origin);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return respond(503, { error: "unavailable" }, origin);
  }

  // No unverified user ID, snapshot, reward amounts or client proof accepted.
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData?.user?.id || authData.user.is_anonymous) {
    return respond(401, { error: "authentication_required" }, origin);
  }

  const size = Number(request.headers.get("Content-Length") || 0);
  if (size > MAX_BODY_BYTES) return respond(413, { error: "request_too_large" }, origin);
  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return respond(413, { error: "request_too_large" }, origin);
    }
    input = JSON.parse(raw);
  } catch {
    return respond(400, { error: "invalid_json" }, origin);
  }
  if (!checkFirstBoxRequest(input)) return respond(400, { error: "invalid_input" }, origin);

  const service = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await service.rpc("toolya_rewards_pilot_first_box", {
    p_user_id: authData.user.id,
    p_expected_revision: input.expectedRevision,
    p_location_id: input.locationId,
    p_box: { ...input.box, name: input.box.name.trim() }
  });

  // No untrusted SQL error text returned to browser; never log user content.
  if (error) {
    if (error.code === "40001") return respond(409, { error: "revision_conflict" }, origin);
    if (error.code === "22023") return respond(422, { error: "not_eligible" }, origin);
    return respond(503, { error: "save_unavailable" }, origin);
  }
  if (!Array.isArray(data) || data.length !== 1 ||
      !validPositiveInt(data[0]?.persisted_revision) ||
      !validPositiveInt(data[0]?.box_id) ||
      typeof data[0]?.reward_granted !== "boolean") {
    return respond(503, { error: "invalid_server_receipt" }, origin);
  }
  return respond(200, {
    saved: true,
    revision: data[0].persisted_revision,
    boxId: data[0].box_id,
    reward: data[0].reward_granted
      ? { granted: true, xp: 20, kp: 10, competency: "organisation" }
      : { granted: false }
  }, origin);
});
