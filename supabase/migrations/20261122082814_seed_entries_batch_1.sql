/*
# Seed sample entries for Informational, Reference, Educational

1. Purpose
   Adds 12 realistic published sample entries (4 per vertical) to make the
   platform immediately usable.

2. Data added
   - 4 Informational entries (guides/how-tos).
   - 4 Reference entries (lookup tables, cheat sheets).
   - 4 Educational entries (lessons, course outlines).

3. Notes
   - Idempotent via NOT EXISTS on (vertical_id, slug).
*/

INSERT INTO entries (vertical_id, slug, title, summary, content, status, source_url, published_at, metadata)
SELECT v.id, e.slug, e.title, e.summary, e.content, 'published', e.source_url, e.published_at, e.metadata::jsonb
FROM verticals v
JOIN (VALUES
  ('informational', 'how-to-read-a-credit-report',
   'How to Read a Credit Report',
   'A plain-English walkthrough of every section of a credit report and what lenders look for.',
   'A credit report is divided into identification, accounts, inquiries, and public records. Lenders weight payment history and utilization most heavily...',
   'https://example.org/guides/credit-report', now() - interval '3 days',
   '{"reading_time_min": 6, "difficulty": "beginner"}'),
  ('informational', 'choosing-a-heat-pump-for-your-home',
   'Choosing a Heat Pump for Your Home',
   'Sizing, efficiency ratings, and climate fit: what to check before buying a heat pump.',
   'Heat pumps are rated by COP and HSPF. Cold-climate units maintain capacity below -15C. Sizing should be based on a manual J load calculation...',
   'https://example.org/guides/heat-pump', now() - interval '10 days',
   '{"reading_time_min": 8, "difficulty": "intermediate"}'),
  ('informational', 'what-is-two-factor-authentication',
   'What Is Two-Factor Authentication?',
   'Why a second factor stops most account takeovers and how to set it up safely.',
   'Two-factor authentication adds a possession or biometric factor to your password. Authenticator apps are preferred over SMS due to SIM-swap risk...',
   'https://example.org/guides/2fa', now() - interval '21 days',
   '{"reading_time_min": 5, "difficulty": "beginner"}'),
  ('informational', 'understanding-your-water-bill',
   'Understanding Your Water Bill',
   'Decode usage tiers, sewer charges, and the fixed service fee on a typical municipal bill.',
   'Most municipal bills combine a fixed service charge with volumetric tiers. Tiered pricing rises per thousand gallons once usage crosses thresholds...',
   'https://example.org/guides/water-bill', now() - interval '40 days',
   '{"reading_time_min": 4, "difficulty": "beginner"}'),

  ('reference', 'metric-prefixes-quick-reference',
   'Metric Prefixes: Quick Reference',
   'Kilo to tera and everything between, with symbols and multipliers in one table.',
   'yotta Y 10^24 | zetta Z 10^21 | exa E 10^18 | peta P 10^15 | tera T 10^12 | giga G 10^9 | mega M 10^6 | kilo k 10^3 ...',
   'https://example.org/ref/metric-prefixes', now() - interval '2 days',
   '{"format": "table", "updated_quarterly": true}'),
  ('reference', 'us-paper-size-chart',
   'US Paper Size Chart',
   'Letter, legal, ledger, and tabloid dimensions in inches and millimeters.',
   'Letter 8.5x11 in (216x279 mm) | Legal 8.5x14 in (216x356 mm) | Tabloid 11x17 in (279x432 mm)...',
   'https://example.org/ref/paper-sizes', now() - interval '15 days',
   '{"format": "table"}'),
  ('reference', 'greek-alphabet-reference',
   'Greek Alphabet Reference',
   'All 24 Greek letters with names, symbols, and common scientific uses.',
   'Alpha: angles, coefficients | Beta: angles, beta decay | Gamma: photons, gamma rays | Delta: change, differentials...',
   'https://example.org/ref/greek-alphabet', now() - interval '30 days',
   '{"format": "table"}'),
  ('reference', 'regex-syntax-cheat-sheet',
   'Regex Syntax Cheat Sheet',
   'Common regular expression tokens, quantifiers, and lookarounds at a glance.',
   'Caret: start anchor | Dollar: end anchor | Dot: any char | Backslash-d: digit | Star: zero or more | Plus: one or more | Question: optional...',
   'https://example.org/ref/regex', now() - interval '55 days',
   '{"format": "cheatsheet"}'),

  ('educational', 'fractions-basics-lesson-1',
   'Fractions Basics: Lesson 1',
   'Numerator, denominator, and equivalent fractions explained with visual models.',
   'A fraction names a part of a whole. The denominator counts equal pieces; the numerator counts shaded pieces. One half equals two quarters because both cover the same area...',
   'https://example.org/edu/fractions-1', now() - interval '1 day',
   '{"grade_band": "3-5", "duration_min": 25}'),
  ('educational', 'photosynthesis-lesson-plan',
   'Photosynthesis: Lesson Plan',
   'A middle-school lesson with objectives, demo, and assessment for photosynthesis.',
   'Objective: students explain how light, water, and CO2 become glucose and oxygen. Demo: elodea in indicator solution shows CO2 uptake...',
   'https://example.org/edu/photosynthesis', now() - interval '8 days',
   '{"grade_band": "6-8", "duration_min": 45}'),
  ('educational', 'intro-sql-course-outline',
   'Intro to SQL: Course Outline',
   'A 6-week outline moving from SELECT basics through joins to simple aggregations.',
   'Week 1: SELECT, WHERE, ORDER BY. Week 2: LIMIT, DISTINCT, NULL handling. Week 3: INNER and LEFT JOIN. Week 4: GROUP BY and HAVING...',
   'https://example.org/edu/sql-course', now() - interval '18 days',
   '{"level": "beginner", "weeks": 6}'),
  ('educational', 'essay-writing-workshop',
   'Essay Writing Workshop',
   'Thesis statements, paragraph structure, and revision checklists for new writers.',
   'A strong thesis takes a position and previews the argument. Body paragraphs follow claim, evidence, analysis. Revision checks logic before grammar...',
   'https://example.org/edu/essay-workshop', now() - interval '35 days',
   '{"grade_band": "9-12", "duration_min": 60}')
) AS e(vertical_slug, slug, title, summary, content, source_url, published_at, metadata)
  ON e.vertical_slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM entries existing
  WHERE existing.vertical_id = v.id AND existing.slug = e.slug
);
