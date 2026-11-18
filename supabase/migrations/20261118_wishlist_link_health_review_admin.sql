-- Service-role only: manually inspect HTTP 404/410 review flags.
-- These are hints, never automatic unpublishing decisions.
CREATE OR REPLACE FUNCTION public.wishlist_link_health_review()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
 SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'list_key',r.list_key,
   'profile_id',r.user_id,
   'name',r.display_name,
   'http_status',r.http_status,
   'checked_at',r.checked_at
 ) ORDER BY r.checked_at DESC), '[]'::jsonb)
 FROM (
   SELECT h.list_key,h.http_status,h.checked_at,d.user_id,d.display_name
   FROM toolya_private.wishlist_link_health h
   JOIN LATERAL (
     SELECT p.user_id,p.display_name
     FROM public.wishlist_directory p
     CROSS JOIN LATERAL pg_catalog.jsonb_array_elements(p.lists) l
     WHERE public.wishlist_link_key(l->>'url')=h.list_key
     ORDER BY p.updated_at DESC LIMIT 1
   ) d ON TRUE
   WHERE h.outcome='review_404_410'
   ORDER BY h.checked_at DESC LIMIT 50
 ) r
$$;
REVOKE ALL ON FUNCTION public.wishlist_link_health_review() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wishlist_link_health_review() TO service_role;
