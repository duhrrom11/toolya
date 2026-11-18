import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root = new URL('../../', import.meta.url);
const get = path => readFileSync(new URL(path, root), 'utf8');
const edge = get('supabase/functions/wishlist-discovery/index.ts');
const healthSql = get('supabase/migrations/20261118_wishlist_link_health_daily.sql');
const summarySql = get('supabase/migrations/20261118_wishlist_link_health_admin_summary.sql');
const admin = get('admin-stats-dashboard/wishlist-finder.mjs');

test('link check is daily, bounded, private and never changes published records', () => {
  assert.match(healthSql, /LIMIT 5\s+FOR UPDATE OF h SKIP LOCKED/);
  assert.match(healthSql, /cron\.schedule\('wishlist-link-health-dispatch','10 3 \* \* \*'/);
  assert.match(healthSql, /cron\.schedule\('wishlist-link-health-collect','\*\/10 \* \* \* \*'/);
  assert.match(healthSql, /REVOKE ALL ON toolya_private\.wishlist_link_health FROM PUBLIC, anon, authenticated/);
  assert.match(healthSql, /WHEN code IN \(404,410\).*'review_404_410'/);
  assert.match(healthSql, /ELSE 'unknown_response'/);
  assert.doesNotMatch(healthSql, /\bdelete\s+from\s+(?:public\.)?wishlist_(?:public_profiles|imported_entries|discovery_candidates)/i);
  assert.doesNotMatch(healthSql, /\bupdate\s+(?:public\.)?wishlist_(?:public_profiles|imported_entries|discovery_candidates)/i);
  assert.match(healthSql, /amazon\[\.\]/);
});

test('only privileged admin can see aggregated health data', () => {
  assert.match(summarySql, /SECURITY DEFINER/);
  assert.match(summarySql, /GRANT EXECUTE ON FUNCTION public\.wishlist_link_health_summary\(\) TO service_role/);
  assert.match(summarySql, /REVOKE ALL ON FUNCTION public\.wishlist_link_health_summary\(\) FROM PUBLIC, anon, authenticated/);
  assert.match(edge, /db\.rpc\('wishlist_link_health_summary'\)/);
  assert.match(admin, /healthStatus/);
});

test('international finder still stages records for manual publication', () => {
  for (const phrase of ['my Amazon wishlist', 'lista de deseos de Amazon', 'lista dei desideri Amazon', 'Amazon verlanglijst', 'Amazon ほしい物リスト']) {
    assert.ok(edge.includes(phrase), phrase);
  }
  assert.match(edge, /explicitOwner\(a\)/);
  assert.match(edge, /links=new Map/);
  assert.match(edge, /status:'new'/);
  assert.match(edge, /action==='publish'/);
  assert.match(edge, /candidate\(\{name:item\.name/);
});
