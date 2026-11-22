/*
# Category assignment + full-text search for entries

1. Purpose
   Lets the public frontend filter listings by category and power a fast
   global search across all verticals.

2. Schema changes
   - `entries`: new nullable column `category_id bigint REFERENCES categories(id)`.
     Nullable so ingestion can insert uncategorized rows. Standard index added
     on (category_id, id DESC) to back cursor-paged category listings.
   - `entries`: new generated column `search_vector tsvector` built from title
     and summary (two-arg to_tsvector, immutable), plus a GIN index for fast
     full-text matching at scale.

3. New Functions
   - `search_entries(p_query text, p_vertical_id bigint DEFAULT NULL,
     p_cursor_id bigint DEFAULT NULL, p_limit int DEFAULT 20)` — keyset-paged
     search over published entries, optionally scoped to one vertical. Orders
     by id DESC and filters id < cursor, matching the app's cursor pattern.

4. Data changes
   - Assigns each seeded sample entry to a sensible category in its vertical
     so category filtering is demonstrable immediately.

5. Security
   - No RLS changes (entries already has public read policies).
   - EXECUTE on search_entries granted to anon + authenticated; revoked from
     PUBLIC. Function is SECURITY INVOKER, so RLS still applies.
*/

ALTER TABLE entries ADD COLUMN IF NOT EXISTS category_id bigint REFERENCES categories(id);
CREATE INDEX IF NOT EXISTS entries_category_id_idx ON entries (category_id, id DESC);

ALTER TABLE entries ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS entries_search_vector_idx ON entries USING GIN (search_vector);

CREATE OR REPLACE FUNCTION search_entries(
  p_query text,
  p_vertical_id bigint DEFAULT NULL,
  p_cursor_id bigint DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id bigint,
  vertical_id bigint,
  slug text,
  title text,
  summary text,
  status text,
  published_at timestamptz
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT e.id, e.vertical_id, e.slug, e.title, e.summary, e.status, e.published_at
  FROM entries e
  WHERE e.status = 'published'
    AND e.search_vector @@ websearch_to_tsquery('english', p_query)
    AND (p_vertical_id IS NULL OR e.vertical_id = p_vertical_id)
    AND (p_cursor_id IS NULL OR e.id < p_cursor_id)
  ORDER BY e.id DESC
  LIMIT p_limit;
$$;

REVOKE EXECUTE ON FUNCTION search_entries(text, bigint, bigint, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION search_entries(text, bigint, bigint, int) TO anon, authenticated;

-- Category assignments for seeded sample entries
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'how-to-guides')
WHERE slug IN ('how-to-read-a-credit-report', 'choosing-a-heat-pump-for-your-home');
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'explainers')
WHERE slug IN ('what-is-two-factor-authentication', 'understanding-your-water-bill');
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'conversion-tables')
WHERE slug IN ('metric-prefixes-quick-reference', 'us-paper-size-chart');
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'glossaries')
WHERE slug = 'greek-alphabet-reference';
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'cheat-sheets')
WHERE slug = 'regex-syntax-cheat-sheet';
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'lessons')
WHERE slug IN ('fractions-basics-lesson-1', 'photosynthesis-lesson-plan');
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'courses')
WHERE slug = 'intro-sql-course-outline';
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'exercises')
WHERE slug = 'essay-writing-workshop';
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'people')
WHERE slug = 'marie-curious-biography';
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'places')
WHERE slug = 'great-barrier-reef';
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'events')
WHERE slug IN ('the-transcontinental-railroad', 'treaty-of-westphalia');
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'tools')
WHERE slug IN ('cordless-drill-18v-class', 'raised-garden-beds');
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'electronics')
WHERE slug IN ('led-floodlights-outdoor', 'usb-c-hubs-and-docks');
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'papers')
WHERE slug = 'soil-carbon-sequestration-meta-analysis';
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'datasets')
WHERE slug = 'exoplanet-transit-dataset-dr25';
UPDATE entries SET category_id = (SELECT id FROM categories WHERE slug = 'technical-summaries')
WHERE slug IN ('mrna-vaccine-stability-review', 'glacier-mass-balance-2025-summary');
