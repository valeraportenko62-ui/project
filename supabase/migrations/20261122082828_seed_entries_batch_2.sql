/*
# Seed sample entries for Encyclopedic, Catalogs, Scientific

1. Purpose
   Adds the remaining 12 realistic published sample entries (4 per vertical).

2. Data added
   - 4 Encyclopedic entries (people, places, events).
   - 4 Catalogs entries (product classes with specs).
   - 4 Scientific entries (papers, datasets, technical summaries).

3. Notes
   - Idempotent via NOT EXISTS on (vertical_id, slug).
*/

INSERT INTO entries (vertical_id, slug, title, summary, content, status, source_url, published_at, metadata)
SELECT v.id, e.slug, e.title, e.summary, e.content, 'published', e.source_url, e.published_at, e.metadata::jsonb
FROM verticals v
JOIN (VALUES
  ('encyclopedic', 'the-transcontinental-railroad',
   'Transcontinental Railroad',
   'How the 1869 rail link across the United States reshaped trade and settlement.',
   'Completed on May 10, 1869 at Promontory Summit, Utah, the line joined the Central Pacific and Union Pacific railroads, cutting coast-to-coast travel from months to about a week...',
   'https://example.org/ency/transcontinental-railroad', now() - interval '4 days',
   '{"article_class": "featured", "last_reviewed": "2026-10"}'),
  ('encyclopedic', 'marie-curious-biography',
   'Marie Curie',
   'The physicist-chemist who pioneered radioactivity research and won two Nobel Prizes.',
   'Marie Sklodowska Curie (1867-1934) isolated polonium and radium and remains the only person with Nobel Prizes in two different sciences...',
   'https://example.org/ency/marie-curie', now() - interval '12 days',
   '{"article_class": "featured"}'),
  ('encyclopedic', 'great-barrier-reef',
   'Great Barrier Reef',
   'The largest coral reef system on Earth: extent, ecology, and conservation status.',
   'The Great Barrier Reef stretches about 2,300 km off Queensland, Australia, comprising roughly 2,900 individual reefs and 900 islands...',
   'https://example.org/ency/great-barrier-reef', now() - interval '26 days',
   '{"article_class": "standard"}'),
  ('encyclopedic', 'treaty-of-westphalia',
   'Peace of Westphalia',
   'The 1648 treaties that ended the Thirty Years War and shaped modern statehood.',
   'Signed in Munster and Osnabruck, the Peace of Westphalia settled confessional conflicts and affirmed territorial sovereignty principles...',
   'https://example.org/ency/westphalia', now() - interval '48 days',
   '{"article_class": "standard"}'),

  ('catalogs', 'cordless-drill-18v-class',
   '18V Cordless Drills',
   'Specifications and comparison for the current 18V cordless drill class.',
   'Typical specs: torque 45-75 Nm, chuck 13 mm, weight 1.3-1.8 kg with 4Ah pack, brushless motors standard across mid-tier models...',
   'https://example.org/catalog/drills-18v', now() - interval '5 days',
   '{"item_count": 142, "last_synced": "2026-11-18"}'),
  ('catalogs', 'led-floodlights-outdoor',
   'Outdoor LED Floodlights',
   'Lumen output, IP ratings, and wattage classes for outdoor floodlight fixtures.',
   'Residential floodlights run 1000-3000 lumens. IP65 is the practical minimum for exposed mounting. Color temperature options cluster at 2700K and 5000K...',
   'https://example.org/catalog/floodlights', now() - interval '14 days',
   '{"item_count": 96, "last_synced": "2026-11-10"}'),
  ('catalogs', 'raised-garden-beds',
   'Raised Garden Beds',
   'Materials, sizes, and drainage considerations for raised bed planters.',
   'Cedar and powder-coated steel dominate. Standard footprints run 4x8 ft with 10-12 in depth for root vegetables. Drainage requires open bottoms...',
   'https://example.org/catalog/raised-beds', now() - interval '29 days',
   '{"item_count": 58, "last_synced": "2026-10-25"}'),
  ('catalogs', 'usb-c-hubs-and-docks',
   'USB-C Hubs and Docks',
   'Port mixes, power delivery ratings, and display support across USB-C docks.',
   'DisplayPort Alt Mode and 60-100W power delivery distinguish docks from plain hubs. Dual 4K60 output requires DP 1.4 or USB4...',
   'https://example.org/catalog/usb-c-docks', now() - interval '44 days',
   '{"item_count": 210, "last_synced": "2026-10-08"}'),

  ('scientific', 'soil-carbon-sequestration-meta-analysis',
   'Soil Carbon Sequestration: Meta-Analysis',
   'Pooled estimates of cover-crop effects on soil organic carbon from 87 trials.',
   'Across 87 field trials, cover cropping raised soil organic carbon stocks by a mean of 0.32 Mg C per hectare per year, with high heterogeneity across climates...',
   'https://doi.org/example/scs-meta', now() - interval '6 days',
   '{"field": "soil science", "n_trials": 87}'),
  ('scientific', 'exoplanet-transit-dataset-dr25',
   'Exoplanet Transit Dataset DR25',
   'Kepler DR25 candidate catalog: detection metrics, false-positive probabilities, and dispositions.',
   'DR25 finalizes transit search over the full Kepler prime mission with robovetter dispositions for 8,054 candidates and completeness products...',
   'https://doi.org/example/kepler-dr25', now() - interval '16 days',
   '{"field": "astronomy", "records": 8054}'),
  ('scientific', 'mrna-vaccine-stability-review',
   'mRNA Vaccine Stability: Review',
   'Temperature-dependent stability of lipid nanoparticle mRNA formulations.',
   'LNP-encapsulated mRNA degrades via hydrolysis and oxidation; storage at -70C preserves potency for months while 2-8C bounds vary by formulation...',
   'https://doi.org/example/mrna-stability', now() - interval '33 days',
   '{"field": "biochemistry", "type": "review"}'),
  ('scientific', 'glacier-mass-balance-2025-summary',
   'Glacier Mass Balance 2025: Summary',
   'Annual technical summary of measured glacier mass balance across monitoring networks.',
   'Reference glaciers recorded a mean mass balance of -1.1 m water equivalent in 2025, continuing a multi-decade cumulative loss trend...',
   'https://doi.org/example/glacier-2025', now() - interval '52 days',
   '{"field": "glaciology", "records": 240}')
) AS e(vertical_slug, slug, title, summary, content, source_url, published_at, metadata)
  ON e.vertical_slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM entries existing
  WHERE existing.vertical_id = v.id AND existing.slug = e.slug
);
