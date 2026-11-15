import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../docs/isolated-toolya-revision-rpc.sql', import.meta.url), 'utf8');

test('RPC remains invoker-only and never grants anonymous execute', () => {
  assert.match(sql, /language plpgsql security invoker/i);
  assert.doesNotMatch(sql, /security definer/i);
  assert.match(sql, /revoke all on function public\.toolya_save_snapshot\(text,jsonb,bigint\) from public, anon/i);
  assert.match(sql, /grant execute on function public\.toolya_save_snapshot\(text,jsonb,bigint\) to authenticated/i);
});
test('atomic CAS uses expected integer revision and checks owner', () => {
  assert.match(sql, /d\.user_id\s*=\s*v_uid\s+and d\.tool\s*=\s*p_tool/i);
  assert.match(sql, /d\.revision\s*=\s*p_expected_revision/i);
  assert.match(sql, /revision\s*=\s*d\.revision\s*\+\s*1/i);
  assert.match(sql, /on conflict \(user_id,tool\) do nothing/i);
});
test('both INSERT and UPDATE RETURNING target checked local variables', () => {
  const targets = [...sql.matchAll(/returning\s+[^;]*?\s+into\s+([^;]+);/gi)].map(m => m[1].trim());
  assert.deepEqual(targets, ['v_data,v_revision','v_data,v_revision']);
  assert.match(sql, /if v_revision is null then/i);
  assert.match(sql, /revision := v_revision;/i);
});
test('anonymous identities are rejected and payload size bounded', () => {
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /auth\.jwt\(\)->>'is_anonymous'/);
  assert.match(sql, /octet_length\(p_data::text\) > 5000000/);
});
