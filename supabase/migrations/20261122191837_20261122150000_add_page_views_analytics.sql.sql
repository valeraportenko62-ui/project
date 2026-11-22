/*
# Page Views / Traffic Analytics

1. New Tables
- `page_views` — daily per-path aggregated traffic table.
  - `id` (bigint identity primary key)
  - `view_date` (date, default current_date) — day the views happened
  - `path` (text) — page path (e.g. "/educational/some-entry")
  - `vertical_id` (bigint, nullable) — link to a vertical when the page belongs to one
  - `entry_id` (bigint, nullable) — link to an entry when the page is an entry page
  - `views_count` (bigint, default 1) — number of views for that day+path
  - UNIQUE (view_date, path) so increments are atomic upserts
  - Index on (view_date DESC) and (views_count DESC) for fast analytics reads
2. New Functions
- `track_page_view(p_path text, p_vertical_id bigint default null, p_entry_id bigint default null)` —
  SECURITY DEFINER RPC that atomically upserts the (view_date, path) row and adds 1 to views_count.
  Returns the new count. Safe to call from the public site (anon).
3. Security
- RLS enabled on `page_views`.
- Public read policy (anon + authenticated) so dashboards can display traffic.
- No public write policy — all writes go through the `track_page_view` RPC (SECURITY DEFINER),
  so visitors can only bump a counter, never insert/modify arbitrary rows.
- GRANT SELECT on `page_views` to anon + authenticated; EXECUTE on the RPC to anon + authenticated.
*/

CREATE TABLE IF NOT EXISTS page_views (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  view_date date NOT NULL DEFAULT current_date,
  path text NOT NULL,
  vertical_id bigint REFERENCES public.verticals(id) ON DELETE SET NULL,
  entry_id bigint REFERENCES public.entries(id) ON DELETE SET NULL,
  views_count bigint NOT NULL DEFAULT 1,
  CONSTRAINT page_views_date_path_unique UNIQUE (view_date, path)
);

CREATE INDEX IF NOT EXISTS page_views_date_idx ON page_views (view_date DESC);
CREATE INDEX IF NOT EXISTS page_views_views_idx ON page_views (views_count DESC);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_views_public_read" ON page_views;
CREATE POLICY "page_views_public_read"
ON page_views FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON page_views TO anon, authenticated;

CREATE OR REPLACE FUNCTION track_page_view(
  p_path text,
  p_vertical_id bigint DEFAULT NULL,
  p_entry_id bigint DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO page_views (view_date, path, vertical_id, entry_id, views_count)
  VALUES (current_date, p_path, p_vertical_id, p_entry_id, 1)
  ON CONFLICT (view_date, path) DO UPDATE
    SET views_count = page_views.views_count + 1,
        vertical_id = COALESCE(EXCLUDED.vertical_id, page_views.vertical_id),
        entry_id = COALESCE(EXCLUDED.entry_id, page_views.entry_id)
  RETURNING views_count;
$$;

REVOKE EXECUTE ON FUNCTION track_page_view(text, bigint, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION track_page_view(text, bigint, bigint) TO anon, authenticated;