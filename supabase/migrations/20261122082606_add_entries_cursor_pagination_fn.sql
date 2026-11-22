/*
# Keyset (cursor) pagination for entries

1. Purpose
   Adds a database function that pages through `entries` using the index
   (vertical_id, status, id DESC) with a keyset/cursor predicate
   (vertical_id, id) < (cursor_vertical_id, cursor_id) instead of OFFSET.
   This keeps every page fetch O(log n) regardless of how deep the page is,
   which is what makes the table safe to grow past 1B rows.

2. New Functions
   - `list_entries_by_vertical(p_vertical_id bigint, p_cursor_id bigint
     DEFAULT NULL, p_limit int DEFAULT 50, p_status text DEFAULT 'published')`
     Returns id, slug, title, summary, status, published_at, created_at for
     entries of one vertical whose id is below the cursor, newest-id first.

3. Security
   - SECURITY INVOKER (default) so RLS on `entries` still applies.
   - Stable search_path for safety.
   - EXECUTE granted to anon and authenticated; revoked from PUBLIC.

4. Notes
   - The cursor is opaque to the caller: it is simply the last `id` from the
     previous page. First page passes NULL.
*/

CREATE OR REPLACE FUNCTION list_entries_by_vertical(
  p_vertical_id bigint,
  p_cursor_id bigint DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_status text DEFAULT 'published'
)
RETURNS TABLE (
  id bigint,
  slug text,
  title text,
  summary text,
  status text,
  published_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT e.id, e.slug, e.title, e.summary, e.status, e.published_at, e.created_at
  FROM entries e
  WHERE e.vertical_id = p_vertical_id
    AND e.status = p_status
    AND (p_cursor_id IS NULL OR e.id < p_cursor_id)
  ORDER BY e.id DESC
  LIMIT p_limit;
$$;

REVOKE EXECUTE ON FUNCTION list_entries_by_vertical(bigint, bigint, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION list_entries_by_vertical(bigint, bigint, int, text) TO anon, authenticated;
