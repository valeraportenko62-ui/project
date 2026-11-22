# Project memory

## Product intent & audience

- **CENTRAL WEBSITE** — single-domain, unified-admin platform aggregating content across 6 verticals.
- Must scale to 1B+ records without re-architecting; designed from day one for high-volume data ingestion and retrieval.
- Audience: end users browsing/knowledge-lookup; admins managing all verticals from one interface (not yet built).
- Verticals and target volumes: Informational (10M+), Reference (10M+), Educational (10M+), Encyclopedic (10M+), Catalogs (10M+), Scientific (5M+).

## Brand personality & voice

- Not yet inferred from user-facing copy; domain is knowledge/reference/data-catalog, suggesting factual, structured, neutral presentation.

## Visual design & UX direction

- No UI built yet; admin UI is the stated next step.
- Listing pages must use cursor/keyset pagination (not offset) — affects UI pagination component design (next/prev cursors, not page numbers).

## Decisions, constraints & rationale

- **Database:** Supabase / PostgreSQL.
- **IDs:** 8-byte BIGINT identity on all tables (`verticals`, `entries`, `categories`, `relations`, `ingestion_queue`).
- **Partitioning:** hash-partitioned into 16 shards per table, enabling 1B+ scale without restructuring.
- **Indexes:** composite indexes back every listing path.
- **Pagination:** DB-level keyset/cursor pagination function; deep pages stay constant-latency.
- **RLS:** enabled on all five tables; explicit read/write grants. No sign-in flow yet — public read, controlled write.
- **Data layer:** TypeScript helpers in `src/lib/` for vertical/category listing, cursor-paged entry + queue listings, entry CRUD, related entries, ingestion enqueue.
- **Seed state:** 6 verticals, 18 categories (3 per vertical), 24 published entries (4 per vertical), 8 relation links, 1 completed ingestion job per vertical — all verified.
- **Migration practice:** large migrations get truncated by payload size limits; split seeds into smaller batches. Missing join conditions and unclosed string literals in large SQL batches cause silent/hard-to-trace errors — validate incrementally.

## Open questions & assumptions

- Admin UI design, auth model, and write-permission strategy not yet defined.
- Frontend framework and component library not yet chosen.
- Branding, visual identity, and tone of voice unestablished.
- Assumed 16 hash partitions is sufficient for initial scale; partition count may need revisiting as real load patterns emerge.
- Entry search/full-text indexing strategy not yet addressed.
- Retention and ingestion-queue lifecycle (cleanup, replay) policies not specified.