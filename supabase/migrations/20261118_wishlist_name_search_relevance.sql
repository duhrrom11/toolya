-- Toolya Wishlist: search public Amazon wishlist links by person or organisation.
-- No data backfill, no change to grants, policies, stored profiles or imported URLs.
-- Deliberately use PostgreSQL POSIX whitespace classes (not escaped \s).
CREATE OR REPLACE FUNCTION public.search_wishlist_directory(
  search_term text DEFAULT ''::text,
  country_filter text DEFAULT ''::text,
  occasion_filter text DEFAULT ''::text,
  interest_filter text DEFAULT ''::text,
  page_offset integer DEFAULT 0
)
RETURNS SETOF public.wishlist_directory
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  WITH input AS (
    SELECT pg_catalog.lower(pg_catalog.btrim(coalesce(search_term, ''))) AS query
  )
  SELECT p.*
  FROM public.wishlist_directory p
  CROSS JOIN input i
  WHERE pg_catalog.length(coalesce(search_term, '')) <= 150
    AND (pg_catalog.btrim(coalesce(country_filter, '')) = ''
      OR pg_catalog.lower(pg_catalog.btrim(p.country)) = pg_catalog.lower(pg_catalog.btrim(country_filter)))
    AND (coalesce(interest_filter, '') = '' OR interest_filter = ANY(p.interests))
    AND (coalesce(occasion_filter, '') = ''
      OR EXISTS (SELECT 1 FROM pg_catalog.jsonb_array_elements(p.lists) l
                 WHERE l->>'occasion' = occasion_filter))
    AND NOT EXISTS (
      SELECT 1
      FROM pg_catalog.regexp_split_to_table(i.query, '[[:space:]]+') token
      WHERE token <> ''
        AND pg_catalog.strpos(
          pg_catalog.lower(pg_catalog.concat_ws(' ', p.display_name, p.country, p.city,
            p.bio, pg_catalog.array_to_string(p.interests, ' '), p.lists::text)),
          token
        ) = 0
    )
  ORDER BY
    CASE
      WHEN i.query <> '' AND pg_catalog.lower(pg_catalog.btrim(p.display_name)) = i.query THEN 0
      WHEN i.query <> '' AND pg_catalog.lower(p.display_name) LIKE i.query || '%' THEN 1
      WHEN i.query <> '' AND pg_catalog.strpos(pg_catalog.lower(p.display_name), i.query) > 0 THEN 2
      ELSE 3
    END,
    p.display_name ASC, p.user_id
  LIMIT 25
  OFFSET least(greatest(coalesce(page_offset, 0), 0), 100000)
$function$;
