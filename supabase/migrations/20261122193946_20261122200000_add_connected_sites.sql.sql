/*
# Connected Sites directory

1. New Tables
- `connected_sites` — directory of external websites the admin wants to organize and open quickly.
  - `id` (bigint, generated always as identity, primary key)
  - `name` (text, not null) — display name of the site
  - `url` (text, not null) — site URL
  - `category` (text, not null, default 'General') — grouping label for the directory
  - `vertical_id` (bigint, nullable, references verticals(id) ON DELETE SET NULL)
  - `status` (text, not null, default 'active') — one of active / dev / paused
  - `notes` (text, nullable) — free-form reminder
  - `created_at` (timestamptz, default now())
  - Index on category for grouped listing.
2. Security
- RLS enabled. This is a single-tenant, no-sign-in app: the admin UI talks to the database
  with the anon key, so anon + authenticated get full CRUD (public by design, same as the
  rest of the admin data in this project).
- GRANT SELECT, INSERT, UPDATE, DELETE to anon + authenticated.
*/

CREATE TABLE IF NOT EXISTS connected_sites (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  vertical_id bigint REFERENCES public.verticals(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS connected_sites_category_idx ON connected_sites (category);

ALTER TABLE connected_sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connected_sites_select" ON connected_sites;
CREATE POLICY "connected_sites_select"
ON connected_sites FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "connected_sites_insert" ON connected_sites;
CREATE POLICY "connected_sites_insert"
ON connected_sites FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "connected_sites_update" ON connected_sites;
CREATE POLICY "connected_sites_update"
ON connected_sites FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "connected_sites_delete" ON connected_sites;
CREATE POLICY "connected_sites_delete"
ON connected_sites FOR DELETE
TO anon, authenticated
USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON connected_sites TO anon, authenticated;