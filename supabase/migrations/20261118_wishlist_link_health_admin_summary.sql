-- Admin-only aggregate status for the non-destructive wishlist link health sampler.
-- The browser never receives the private health table or URL list.
CREATE OR REPLACE FUNCTION public.wishlist_link_health_summary()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT pg_catalog.jsonb_build_object(
    'total', count(*),
    'not_checked', count(*) FILTER (WHERE outcome='not_checked'),
    'pending', count(*) FILTER (WHERE outcome='pending'),
    'http_reachable', count(*) FILTER (WHERE outcome='http_reachable'),
    'review', count(*) FILTER (WHERE outcome='review_404_410'),
    'unknown', count(*) FILTER (WHERE outcome='unknown_response'),
    'last_checked_at', max(checked_at)
  )
  FROM toolya_private.wishlist_link_health
$$;
REVOKE ALL ON FUNCTION public.wishlist_link_health_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wishlist_link_health_summary() TO service_role;
