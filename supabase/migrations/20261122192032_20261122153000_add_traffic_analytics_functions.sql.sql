/*
# Traffic analytics read functions for the admin dashboard

1. New Functions
- `get_traffic_summary()` — returns today / last 7 days / all-time totals from `page_views`.
- `get_traffic_by_vertical()` — returns views aggregated per vertical (all 6 verticals,
  zero-filled so every vertical always appears).
- `get_top_pages()` — returns the top 10 paths by views, joined to entry titles and
  vertical slugs where the path corresponds to an entry or vertical page.
2. Security
- All three are SECURITY DEFINER (needed to read page_views reliably and centralize logic).
- EXECUTE granted to anon + authenticated (public read of aggregate analytics is intended).
- Each sets a fixed search_path for safety.
*/

CREATE OR REPLACE FUNCTION get_traffic_summary()
RETURNS TABLE (today bigint, last7days bigint, alltime bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(views_count) FILTER (WHERE view_date = current_date), 0)::bigint,
    COALESCE(SUM(views_count) FILTER (WHERE view_date >= current_date - 6), 0)::bigint,
    COALESCE(SUM(views_count), 0)::bigint
  FROM page_views;
$$;

CREATE OR REPLACE FUNCTION get_traffic_by_vertical()
RETURNS TABLE (vertical_id bigint, slug text, name text, views bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id::bigint,
    v.slug,
    v.name,
    COALESCE(pv.total, 0)::bigint
  FROM verticals v
  LEFT JOIN (
    SELECT vertical_id, SUM(views_count) AS total
    FROM page_views
    WHERE vertical_id IS NOT NULL
    GROUP BY vertical_id
  ) pv ON pv.vertical_id = v.id
  ORDER BY v.sort_order;
$$;

CREATE OR REPLACE FUNCTION get_top_pages()
RETURNS TABLE (path text, views bigint, entry_title text, vertical_slug text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pv.path,
    SUM(pv.views_count)::bigint AS views,
    MAX(e.title) AS entry_title,
    MAX(v.slug) AS vertical_slug
  FROM page_views pv
  LEFT JOIN entries e ON e.id = pv.entry_id
  LEFT JOIN verticals v ON v.id = pv.vertical_id
  GROUP BY pv.path
  ORDER BY views DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION get_traffic_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_traffic_by_vertical() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_pages() TO anon, authenticated;