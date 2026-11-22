export type EntryStatus = 'draft' | 'published' | 'archived'
export type RelationType = 'parent_child' | 'related' | 'cites' | 'translates'
export type IngestionStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface Vertical {
  id: number
  slug: string
  name: string
  description: string | null
  target_volume: string
  sort_order: number
  created_at: string
}

export interface Category {
  id: number
  vertical_id: number
  slug: string
  name: string
  parent_category_id: number | null
  created_at: string
}

export interface Entry {
  id: number
  vertical_id: number
  slug: string
  title: string
  summary: string | null
  content: string | null
  status: EntryStatus
  locale: string
  source_url: string | null
  published_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Relation {
  id: number
  parent_entry_id: number
  child_entry_id: number
  relation_type: RelationType
  created_at: string
}

export interface IngestionJob {
  id: number
  vertical_id: number
  source_type: string
  source_url: string | null
  payload: Record<string, unknown>
  status: IngestionStatus
  attempts: number
  last_error: string | null
  created_at: string
  processed_at: string | null
}

export interface Page<T> {
  items: T[]
  nextCursor: number | null
  hasMore: boolean
}
