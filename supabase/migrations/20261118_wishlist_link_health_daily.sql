-- Non-destructive, low-volume health sampling of already-published Amazon wishlist links.
-- Responses are only technical hints; 200 does NOT prove that a list is public,
-- and 403/429/timeouts never cause removal or hiding.
CREATE TABLE IF NOT EXISTS toolya_private.wishlist_link_health (
  list_key text PRIMARY KEY,
  request_id bigint,
  requested_at timestamptz,
  checked_at timestamptz,
  next_check_at timestamptz NOT NULL DEFAULT now(),
  http_status integer,
  outcome text NOT NULL DEFAULT 'not_checked'
    CHECK (outcome IN ('not_checked','pending','http_reachable','review_404_410','unknown_response')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE toolya_private.wishlist_link_health ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON toolya_private.wishlist_link_health FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION toolya_private.wishlist_link_check_collect()
RETURNS integer LANGUAGE plpgsql SET search_path TO '' AS $$
DECLARE rec record; processed integer := 0; code integer; timed boolean;
BEGIN
  FOR rec IN
    SELECT h.list_key,h.request_id,r.status_code,r.timed_out,r.error_msg
    FROM toolya_private.wishlist_link_health h
    LEFT JOIN net._http_response r ON r.id = h.request_id
    WHERE h.outcome='pending' AND h.request_id IS NOT NULL
      AND (r.id IS NOT NULL OR h.requested_at < now()-interval '1 hour')
    ORDER BY h.requested_at LIMIT 100
  LOOP
    code := rec.status_code;
    timed := coalesce(rec.timed_out,false);
    UPDATE toolya_private.wishlist_link_health
    SET outcome = CASE
        WHEN code BETWEEN 200 AND 299 AND NOT timed THEN 'http_reachable'
        WHEN code IN (404,410) AND NOT timed THEN 'review_404_410'
        ELSE 'unknown_response'
      END,
      http_status = code,
      request_id = NULL,
      checked_at = now(),
      next_check_at = now()+CASE WHEN code IN (404,410) THEN interval '14 days'
                                  WHEN code BETWEEN 200 AND 299 THEN interval '30 days'
                                  ELSE interval '7 days' END,
      updated_at = now()
    WHERE list_key = rec.list_key AND request_id = rec.request_id;
    processed := processed + 1;
  END LOOP;
  RETURN processed;
END $$;
REVOKE ALL ON FUNCTION toolya_private.wishlist_link_check_collect() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION toolya_private.wishlist_link_check_dispatch()
RETURNS integer LANGUAGE plpgsql SET search_path TO '' AS $$
DECLARE rec record; submitted integer := 0; request bigint;
BEGIN
  -- Read-only source: only lists already published in the public directory.
  INSERT INTO toolya_private.wishlist_link_health(list_key)
  SELECT DISTINCT public.wishlist_link_key(item->>'url')
  FROM public.wishlist_directory d
  CROSS JOIN LATERAL jsonb_array_elements(d.lists) item
  WHERE public.wishlist_link_key(item->>'url') IS NOT NULL
  ON CONFLICT(list_key) DO NOTHING;

  -- At most five requests a day, no redirect forwarding or credential use.
  FOR rec IN
    SELECT h.list_key, ('https://www.amazon.de/hz/wishlist/ls/'||h.list_key) AS url
    FROM toolya_private.wishlist_link_health h
    WHERE h.outcome <> 'pending'
      AND h.next_check_at <= now()
      AND EXISTS(
        SELECT 1 FROM public.wishlist_directory d
        CROSS JOIN LATERAL jsonb_array_elements(d.lists) item
        WHERE public.wishlist_link_key(item->>'url')=h.list_key
      )
      AND h.list_key ~ '^[A-Z0-9]{8,40}$'
    ORDER BY h.next_check_at,h.list_key
    LIMIT 5
    FOR UPDATE OF h SKIP LOCKED
  LOOP
    -- Never construct a user-controlled URL: fixed HTTPS Amazon host and validated ID.
    request := net.http_get(
      url => rec.url,
      headers => '{"User-Agent":"ToolyaWishlistHealth/1.0 (+https://toolya.app)","Accept":"text/html"}'::jsonb,
      timeout_milliseconds => 7000
    );
    UPDATE toolya_private.wishlist_link_health
    SET request_id=request,requested_at=now(),outcome='pending',updated_at=now()
    WHERE list_key=rec.list_key;
    submitted := submitted+1;
  END LOOP;
  RETURN submitted;
END $$;
REVOKE ALL ON FUNCTION toolya_private.wishlist_link_check_dispatch() FROM PUBLIC,anon,authenticated;

-- Cron executes with its database owner role; neither job deletes or changes a wishlist.
SELECT cron.schedule('wishlist-link-health-collect','*/10 * * * *',
  'SELECT toolya_private.wishlist_link_check_collect()');
SELECT cron.schedule('wishlist-link-health-dispatch','10 3 * * *',
  'SELECT toolya_private.wishlist_link_check_dispatch()');
