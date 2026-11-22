import { supabase } from './supabase'
import type { Category, Entry, EntryStatus, IngestionJob, Page, SearchHit, Vertical } from './types'

export async function listVerticals(): Promise<Vertical[]> {
  const { data, error } = await supabase
    .from('verticals')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getVerticalBySlug(slug: string): Promise<Vertical | null> {
  const { data, error } = await supabase
    .from('verticals')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data
}

export interface PublicStats {
  totalEntries: number
  perVertical: { vertical_id: number; count: number }[]
}

export async function getPublicStats(): Promise<PublicStats> {
  const { data, error } = await supabase.rpc('get_admin_stats')
  if (error) {
    return { totalEntries: 0, perVertical: [] }
  }
  const stats = data as {
    total_entries: number
    verticals: { vertical_id: number; entry_count: number }[]
  }
  return {
    totalEntries: stats.total_entries,
    perVertical: stats.verticals.map((v) => ({ vertical_id: v.vertical_id, count: v.entry_count })),
  }
}

export async function listCategories(verticalId: number): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('vertical_id', verticalId)
    .order('id')
  if (error) throw error
  return data ?? []
}

export interface ListEntriesOptions {
  verticalId: number
  status?: EntryStatus
  categoryId?: number
  limit?: number
  cursor?: number | null
}

export async function listEntries(opts: ListEntriesOptions): Promise<Page<Entry>> {
  const limit = opts.limit ?? 50
  let query = supabase
    .from('entries')
    .select('*')
    .eq('vertical_id', opts.verticalId)
    .order('id', { ascending: false })
    .limit(limit + 1)
  if (opts.status) query = query.eq('status', opts.status)
  if (opts.categoryId != null) query = query.eq('category_id', opts.categoryId)
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

export async function getEntry(verticalId: number, slugOrId: string): Promise<Entry | null> {
  const isNumeric = /^\d+$/.test(slugOrId)
  let query = supabase.from('entries').select('*').eq('vertical_id', verticalId)
  if (isNumeric) {
    query = query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
  } else {
    query = query.eq('slug', slugOrId)
  }
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

export interface SearchOptions {
  query: string
  verticalId?: number
  cursor?: number | null
  limit?: number
}

export async function searchEntries(opts: SearchOptions): Promise<Page<SearchHit>> {
  const limit = opts.limit ?? 20
  const { data, error } = await supabase.rpc('search_entries', {
    p_query: opts.query,
    p_vertical_id: opts.verticalId ?? null,
    p_cursor_id: opts.cursor ?? null,
    p_limit: limit + 1,
  })
  if (error) throw error
  const rows = (data ?? []) as SearchHit[]
  const hasMore = rows.length > limit
  return {
    items: rows.slice(0, limit),
    nextCursor: hasMore ? rows[limit - 1].id : null,
    hasMore,
  }
}

export async function listRelatedEntries(entryId: number): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('relations')
    .select('child:entries!relations_child_entry_id_fkey(*)')
    .eq('parent_entry_id', entryId)
    .order('id', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as { child: Entry }[]).map((row) => row.child)
}

export async function createEntry(input: {
  vertical_id: number
  slug: string
  title: string
  summary?: string
  content?: string
  status?: EntryStatus
  source_url?: string
  metadata?: Record<string, unknown>
}): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateEntry(
  id: number,
  patch: Partial<Pick<Entry, 'title' | 'summary' | 'content' | 'status' | 'source_url' | 'metadata'>>
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

export async function deleteEntry(id: number): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', id)
  if (error) throw error
}

export async function enqueueIngestion(input: {
  vertical_id: number
  source_type: string
  source_url?: string
  payload?: Record<string, unknown>
}): Promise<IngestionJob> {
  const { data, error } = await supabase
    .from('ingestion_queue')
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function listIngestionJobs(opts: {
  verticalId?: number
  cursor?: number | null
  limit?: number
}): Promise<Page<IngestionJob>> {
  const limit = opts.limit ?? 50
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
