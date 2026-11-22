/*
# Admin Dashboard Stats Functions

1. New Functions
- `get_admin_stats()` — returns a single-row summary with:
  - total_entries across all verticals
  - total_relations
  - total_ingestion_jobs
  - per-vertical array of { vertical_id, slug, name, target_volume, entry_count,
    published_count, draft_count, category_count, ingestion_count, ingestion_pending,
    ingestion_done, ingestion_failed }
  - global ingestion summary { pending, processing, done, failed }
- `batch_insert_entries(p_vertical_id bigint, p_count integer, p_status text, p_prefix text)`
  — inserts up to 5000 placeholder entries into the entries table for a given vertical,
  returning the count inserted. Used by the batch record generator simulator.
2. Security
- Both functions are callable by anon + authenticated (no auth on this app).
- No new tables created. Functions are SECURITY INVOKER (default) so RLS on entries/
  ingestion_queue/categories/relations still applies.
- Grants EXECUTE to anon, authenticated.
3. Notes
- get_admin_stats runs aggregate queries across the partitioned entries table; for
  production scale, consider materialized views. For current seed volumes this is fine.
- batch_insert_entries caps at 5000 rows per call to avoid payload/timeout limits.
  The frontend can call it repeatedly to simulate larger batches.
*/

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_entries', (SELECT count(*) FROM entries),
    'total_relations', (SELECT count(*) FROM relations),
    'total_ingestion', (SELECT count(*) FROM ingestion_queue),
    'ingestion_summary', (
      SELECT jsonb_build_object(
        'pending', count(*) FILTER (WHERE status = 'pending'),
        'processing', count(*) FILTER (WHERE status = 'processing'),
        'done', count(*) FILTER (WHERE status = 'done'),
        'failed', count(*) FILTER (WHERE status = 'failed')
      ) FROM ingestion_queue
    ),
    'verticals', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'vertical_id', v.id,
          'slug', v.slug,
          'name', v.name,
          'target_volume', v.target_volume,
          'entry_count', COALESCE(e.cnt, 0),
          'published_count', COALESCE(e.pub, 0),
          'draft_count', COALESCE(e.dft, 0),
          'category_count', COALESCE(c.cnt, 0),
          'ingestion_count', COALESCE(i.cnt, 0),
          'ingestion_pending', COALESCE(i.pending, 0),
          'ingestion_done', COALESCE(i.done, 0),
          'ingestion_failed', COALESCE(i.failed, 0)
        )
        ORDER BY v.sort_order
      )
      FROM verticals v
      LEFT JOIN LATERAL (
        SELECT
          count(*) AS cnt,
          count(*) FILTER (WHERE status = 'published') AS pub,
          count(*) FILTER (WHERE status = 'draft') AS dft
        FROM entries e WHERE e.vertical_id = v.id
      ) e ON true
      LEFT JOIN LATERAL (
        SELECT count(*) AS cnt FROM categories c WHERE c.vertical_id = v.id
      ) c ON true
      LEFT JOIN LATERAL (
        SELECT
          count(*) AS cnt,
          count(*) FILTER (WHERE status = 'pending') AS pending,
          count(*) FILTER (WHERE status = 'done') AS done,
          count(*) FILTER (WHERE status = 'failed') AS failed
        FROM ingestion_queue iq WHERE iq.vertical_id = v.id
      ) i ON true
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION get_admin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO anon, authenticated;


CREATE OR REPLACE FUNCTION batch_insert_entries(
  p_vertical_id bigint,
  p_count integer DEFAULT 100,
  p_status text DEFAULT 'draft',
  p_prefix text DEFAULT 'batch'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
  v_actual integer;
  v_max_id bigint;
BEGIN
  v_count := LEAST(p_count, 5000);

  -- Generate v_count rows using generate_series
  INSERT INTO entries (vertical_id, slug, title, summary, content, status, metadata)
  SELECT
    p_vertical_id,
    p_prefix || '-' || gs::text || '-' || extract(epoch from now())::bigint::text,
    p_prefix || ' Entry #' || gs::text,
    'Auto-generated entry for batch simulation (' || p_prefix || ').',
    'This is a simulated entry created by the batch record generator for load testing and scale validation.',
    p_status,
    jsonb_build_object('batch', true, 'generated_at', now()::text)
  FROM generate_series(1, v_count) AS gs;

  GET DIAGNOSTICS v_actual = ROW_COUNT;

  SELECT COALESCE(max(id), 0) INTO v_max_id FROM entries WHERE vertical_id = p_vertical_id;

  RETURN jsonb_build_object(
    'inserted', v_actual,
    'requested', v_count,
    'max_id', v_max_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION batch_insert_entries(bigint, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION batch_insert_entries(bigint, integer, text, text) TO anon, authenticated;
