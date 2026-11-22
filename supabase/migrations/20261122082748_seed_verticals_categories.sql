/*
# Seed verticals and categories

1. Purpose
   Configures the exact 6 CENTRAL WEBSITE verticals with target volume
   benchmarks, plus 3 starter categories per vertical.

2. Data added
   - `verticals`: Informational (10M+), Reference (10M+), Educational (10M+),
     Encyclopedic (10M+), Catalogs (10M+), Scientific (5M+), in that order.
   - `categories`: 3 per vertical (18 total).

3. Notes
   - Idempotent: re-running adds nothing new.
*/

INSERT INTO verticals (slug, name, description, target_volume, sort_order) VALUES
  ('informational', 'Informational', 'General-purpose informational articles, guides, and how-tos across everyday topics.', '10M+', 1),
  ('reference', 'Reference', 'Dictionaries, glossaries, lookup tables, and quick-reference material.', '10M+', 2),
  ('educational', 'Educational', 'Structured lessons, courses, and learning paths for students and self-learners.', '10M+', 3),
  ('encyclopedic', 'Encyclopedic', 'Encyclopedia-style articles covering people, places, events, and things.', '10M+', 4),
  ('catalogs', 'Catalogs', 'Product and item catalogs with specifications and classifications.', '10M+', 5),
  ('scientific', 'Scientific', 'Papers, datasets, and technical summaries across the sciences.', '5M+', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (vertical_id, slug, name)
SELECT v.id, c.slug, c.name
FROM verticals v
JOIN (VALUES
  ('informational', 'how-to-guides', 'How-To Guides'),
  ('informational', 'explainers', 'Explainers'),
  ('informational', 'tips-tricks', 'Tips & Tricks'),
  ('reference', 'glossaries', 'Glossaries'),
  ('reference', 'conversion-tables', 'Conversion Tables'),
  ('reference', 'cheat-sheets', 'Cheat Sheets'),
  ('educational', 'lessons', 'Lessons'),
  ('educational', 'courses', 'Courses'),
  ('educational', 'exercises', 'Exercises'),
  ('encyclopedic', 'people', 'People'),
  ('encyclopedic', 'places', 'Places'),
  ('encyclopedic', 'events', 'Events'),
  ('catalogs', 'electronics', 'Electronics'),
  ('catalogs', 'home-garden', 'Home & Garden'),
  ('catalogs', 'tools', 'Tools'),
  ('scientific', 'papers', 'Papers'),
  ('scientific', 'datasets', 'Datasets'),
  ('scientific', 'technical-summaries', 'Technical Summaries')
) AS c(vertical_slug, slug, name) ON c.vertical_slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM categories existing
  WHERE existing.vertical_id = v.id AND existing.slug = c.slug
);
