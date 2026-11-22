/*
# Seed sample relations and ingestion queue jobs

1. Purpose
   Adds "related" links between entries within each vertical and one completed
   bulk-seed ingestion job per vertical.

2. Data added
   - `relations`: 8 related-links between same-vertical sample entries.
   - `ingestion_queue`: 1 done bulk_seed job per vertical (6 total).

3. Notes
   - Idempotent via NOT EXISTS checks.
*/

INSERT INTO relations (parent_entry_id, child_entry_id, relation_type)
SELECT a.id, b.id, 'related'
FROM entries a
JOIN entries b
  ON b.vertical_id = a.vertical_id
  AND b.id <> a.id
  AND (
    (a.slug = 'fractions-basics-lesson-1' AND b.slug IN ('intro-sql-course-outline', 'essay-writing-workshop'))
    OR (a.slug = 'the-transcontinental-railroad' AND b.slug IN ('treaty-of-westphalia', 'great-barrier-reef'))
    OR (a.slug = 'soil-carbon-sequestration-meta-analysis' AND b.slug IN ('glacier-mass-balance-2025-summary', 'exoplanet-transit-dataset-dr25'))
    OR (a.slug = 'regex-syntax-cheat-sheet' AND b.slug IN ('greek-alphabet-reference', 'metric-prefixes-quick-reference'))
  )
WHERE NOT EXISTS (
  SELECT 1 FROM relations r
  WHERE r.parent_entry_id = a.id AND r.child_entry_id = b.id AND r.relation_type = 'related'
);

INSERT INTO ingestion_queue (vertical_id, source_type, source_url, payload, status, processed_at)
SELECT v.id, 'bulk_seed', 'https://example.org/feeds/' || v.slug || '.xml',
       jsonb_build_object('batch_size', 10000, 'dedupe_key', v.slug || '-initial'),
       'done', now()
FROM verticals v
WHERE NOT EXISTS (
  SELECT 1 FROM ingestion_queue q
  WHERE q.vertical_id = v.id AND q.source_type = 'bulk_seed'
);
