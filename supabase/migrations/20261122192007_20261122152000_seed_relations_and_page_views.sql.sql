/*
# Seed demo relations and page-view history

1. Purpose
- Adds cross-links between related entries so entry detail pages show "Related" content.
- Adds plausible daily page-view rows for the last 14 days so the Traffic & Page Views
  section of the admin dashboard has data to display.
- Both are idempotent (NOT EXISTS guards); entries are referenced by (vertical_id, slug).
2. Tables modified
- `relations`: insert only.
- `page_views`: insert only.
3. Security
- No policy changes.
*/

INSERT INTO relations (parent_entry_id, child_entry_id, relation_type)
SELECT p.id, c.id, r.rel_type
FROM (VALUES
  ('informational', 'how-to-read-a-credit-report', 'informational', 'filing-your-first-tax-return', 'related'),
  ('reference', 'metric-prefixes-quick-reference', 'reference', 'statistics-terms-glossary', 'related'),
  ('educational', 'fractions-basics-lesson-1', 'educational', 'algebra-practice-linear-equations', 'parent_child'),
  ('encyclopedic', 'marie-curious-biography', 'encyclopedic', 'the-apollo-11-mission', 'related'),
  ('encyclopedic', 'nikola-tesla-biography', 'encyclopedic', 'the-transcontinental-railroad', 'related'),
  ('scientific', 'attention-is-transformers-paper', 'scientific', 'genomic-variant-frequency-database', 'cites')
) AS r(p_vertical, p_slug, c_vertical, c_slug, rel_type)
JOIN entries p ON p.vertical_id = (SELECT id FROM verticals WHERE slug = r.p_vertical) AND p.slug = r.p_slug
JOIN entries c ON c.vertical_id = (SELECT id FROM verticals WHERE slug = r.c_vertical) AND c.slug = r.c_slug
WHERE NOT EXISTS (
  SELECT 1 FROM relations rel
  WHERE rel.parent_entry_id = p.id AND rel.child_entry_id = c.id AND rel.relation_type = r.rel_type
);

INSERT INTO page_views (view_date, path, vertical_id, entry_id, views_count)
SELECT current_date - d.days_back,
       d.path,
       (SELECT id FROM verticals WHERE slug = d.vertical_slug),
       (SELECT id FROM entries WHERE vertical_id = (SELECT id FROM verticals WHERE slug = d.vertical_slug) AND slug = d.entry_slug),
       d.views
FROM (VALUES
  ('/informational/how-to-read-a-credit-report', 'informational', 'how-to-read-a-credit-report', 0, 184),
  ('/reference/metric-prefixes-quick-reference', 'reference', 'metric-prefixes-quick-reference', 0, 142),
  ('/educational/fractions-basics-lesson-1', 'educational', 'fractions-basics-lesson-1', 0, 121),
  ('/encyclopedic/marie-curious-biography', 'encyclopedic', 'marie-curious-biography', 0, 167),
  ('/catalogs/cordless-drill-18v-class', 'catalogs', 'cordless-drill-18v-class', 0, 98),
  ('/scientific/exoplanet-transit-dataset-dr25', 'scientific', 'exoplanet-transit-dataset-dr25', 0, 76),
  ('/informational', 'informational', NULL, 1, 64),
  ('/reference', 'reference', NULL, 1, 41),
  ('/educational', 'educational', NULL, 2, 55),
  ('/encyclopedic', 'encyclopedic', NULL, 3, 72),
  ('/catalogs', 'catalogs', NULL, 2, 38),
  ('/scientific', 'scientific', NULL, 4, 33)
) AS d(path, vertical_slug, entry_slug, days_back, views)
WHERE NOT EXISTS (
  SELECT 1 FROM page_views pv WHERE pv.view_date = current_date - d.days_back AND pv.path = d.path
);