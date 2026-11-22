import { supabase } from './supabase'
import type { Category, Entry, EntryStatus, IngestionJob, Relation, RelationType, Vertical } from './types'

export interface VerticalStat {
  vertical_id: number
  slug: string
  name: string
  target_volume: string
  entry_count: number
  published_count: number
  draft_count: number
  category_count: number
  ingestion_count: number
  ingestion_pending: number
  ingestion_done: number
  ingestion_failed: number
}

export interface TrafficSummary {
  today: number
  last7Days: number
  allTime: number
}

export interface VerticalTrafficRow {
  vertical_id: number
  slug: string
  name: string
  views: number
}

export interface TopPageRow {
  path: string
  views: number
  entry_title: string | null
  vertical_slug: string | null
}

export async function getTrafficSummary(): Promise<TrafficSummary> {
  const { data, error } = await supabase.rpc('get_traffic_summary')
  if (error) throw error
  return data as TrafficSummary
}

export async function getTrafficByVertical(): Promise<VerticalTrafficRow[]> {
  const { data, error } = await supabase.rpc('get_traffic_by_vertical')
  if (error) throw error
  return (data ?? []) as VerticalTrafficRow[]
}

export async function getTopPages(): Promise<TopPageRow[]> {
  const { data, error } = await supabase.rpc('get_top_pages')
  if (error) throw error
  return (data ?? []) as TopPageRow[]
}

export interface AdminStats {
  total_entries: number
  total_relations: number
  total_ingestion: number
  ingestion_summary: {
    pending: number
    processing: number
    done: number
    failed: number
  }
  verticals: VerticalStat[]
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('get_admin_stats')
  if (error) throw error
  return data as AdminStats
}

export async function createCategory(input: {
  vertical_id: number
  slug: string
  name: string
  parent_category_id?: number | null
}): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(
  id: number,
  patch: Partial<Pick<Category, 'slug' | 'name' | 'parent_category_id'>>
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function listRelationsWithEntries(): Promise<
  (Relation & { parent_entry: Entry; child_entry: Entry })[]
> {
  const { data, error } = await supabase
    .from('relations')
    .select('*, parent_entry:entries!relations_parent_entry_id_fkey(*), child_entry:entries!relations_child_entry_id_fkey(*)')
    .order('id', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as (Relation & { parent_entry: Entry; child_entry: Entry })[]
}

export async function createRelation(input: {
  parent_entry_id: number
  child_entry_id: number
  relation_type: RelationType
}): Promise<Relation> {
  const { data, error } = await supabase
    .from('relations')
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteRelation(id: number): Promise<void> {
  const { error } = await supabase.from('relations').delete().eq('id', id)
  if (error) throw error
}

export async function listAllEntriesForEditor(opts: {
  verticalId?: number
  status?: EntryStatus
  cursor?: number | null
  limit?: number
  search?: string
}): Promise<{ items: Entry[]; nextCursor: number | null; hasMore: boolean }> {
  const limit = opts.limit ?? 25
  let query = supabase
    .from('entries')
    .select('*')
    .order('id', { ascending: false })
    .limit(limit + 1)
  if (opts.verticalId != null) query = query.eq('vertical_id', opts.verticalId)
  if (opts.status) query = query.eq('status', opts.status)
  if (opts.cursor != null) query = query.lt('id', opts.cursor)
  if (opts.search) query = query.or(`title.ilike.%${opts.search}%,slug.ilike.%${opts.search}%`)

  const { data, error } = await query
  if (error) throw error
  const rows = data ?? []
  const hasMore = rows.length > limit
  return {
    items: rows.slice(0, limit),
    nextCursor: hasMore ? rows[limit - 1].id : null,
    hasMore,
  }
}

export interface EntryInput {
  vertical_id: number
  category_id?: number | null
  slug: string
  title: string
  summary?: string | null
  content?: string | null
  status?: EntryStatus
  locale?: string
  source_url?: string | null
  published_at?: string | null
  metadata?: Record<string, unknown>
}

export async function adminCreateEntry(input: EntryInput): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function adminUpdateEntry(
  id: number,
  patch: Partial<EntryInput>
): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function adminDeleteEntry(id: number): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', id)
  if (error) throw error
}

export async function batchInsertEntries(opts: {
  verticalId: number
  count: number
  status?: EntryStatus
  prefix?: string
}): Promise<{ inserted: number; requested: number; max_id: number }> {
  const { data, error } = await supabase.rpc('batch_insert_entries', {
    p_vertical_id: opts.verticalId,
    p_count: opts.count,
    p_status: opts.status ?? 'draft',
    p_prefix: opts.prefix ?? 'batch',
  })
  if (error) throw error
  return data as { inserted: number; requested: number; max_id: number }
}

export async function listIngestionJobsAdmin(opts: {
  verticalId?: number
  cursor?: number | null
  limit?: number
}): Promise<{ items: IngestionJob[]; nextCursor: number | null; hasMore: boolean }> {
  const limit = opts.limit ?? 25
  let query = supabase
    .from('ingestion_queue')
    .select('*')
    .order('id', { ascending: false })
    .limit(limit + 1)
  if (opts.verticalId != null) query = query.eq('vertical_id', opts.verticalId)
  if (opts.cursor != null) query = query.lt('id', opts.cursor)

  const { data, error } = await query
  if (error) throw error
  const rows = data ?? []
  const hasMore = rows.length > limit
  return {
    items: rows.slice(0, limit),
    nextCursor: hasMore ? rows[limit - 1].id : null,
    hasMore,
  }
}

export async function updateIngestionJob(
  id: number,
  patch: Partial<Pick<IngestionJob, 'status' | 'last_error' | 'processed_at' | 'attempts'>>
): Promise<IngestionJob> {
  const { data, error } = await supabase
    .from('ingestion_queue')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export function parseTargetVolume(vol: string): number {
  const match = vol.match(/([\d.]+)\s*([MmKk]?)/)
  if (!match) return 0
  const num = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === 'M') return num * 1_000_000
  if (unit === 'K') return num * 1_000
  return num
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString()
}

export function getScaleReadiness(entryCount: number, target: number): {
  label: string
  level: 'seed' | 'growth' | 'scaling' | 'production'
  pct: number
} {
  const pct = target > 0 ? (entryCount / target) * 100 : 0
  if (pct >= 10) return { label: 'Production-scale', level: 'production', pct }
  if (pct >= 1) return { label: 'Scaling', level: 'scaling', pct }
  if (pct >= 0.1) return { label: 'Growth phase', level: 'growth', pct }
  return { label: 'Seed data', level: 'seed', pct }
}

export type { Vertical }
