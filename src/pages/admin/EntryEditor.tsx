import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  listAllEntriesForEditor,
  adminCreateEntry,
  adminUpdateEntry,
  adminDeleteEntry,
} from '../../lib/admin'
import type { EntryInput } from '../../lib/admin'
import { useVerticals } from '../../hooks/useVerticals'
import type { Category, Entry, EntryStatus, Vertical } from '../../lib/types'

const PAGE_SIZE = 20
const STATUSES: EntryStatus[] = ['draft', 'published', 'archived']

export default function EntryEditor() {
  const { verticals } = useVerticals()
  const [params, setParams] = useSearchParams()
  const verticalFilter = params.get('vertical') ? Number(params.get('vertical')) : null
  const statusFilter = (params.get('status') as EntryStatus | null) ?? null
  const searchQuery = params.get('q') ?? ''

  const [entries, setEntries] = useState<Entry[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Entry | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const loadEntries = useCallback(async (reset: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const page = await listAllEntriesForEditor({
        verticalId: verticalFilter ?? undefined,
        status: statusFilter ?? undefined,
        search: searchQuery || undefined,
        cursor: reset ? null : cursor,
        limit: PAGE_SIZE,
      })
      setEntries(reset ? page.items : (prev) => [...prev, ...page.items])
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [verticalFilter, statusFilter, searchQuery, cursor])

  useEffect(() => {
    setEntries([])
    setCursor(null)
    loadEntries(true)
  }, [verticalFilter, statusFilter, searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load categories when opening form
  useEffect(() => {
    const vid = editing?.vertical_id ?? verticalFilter ?? verticals[0]?.id
    if (!vid) return
    supabase
      .from('categories')
      .select('*')
      .eq('vertical_id', vid)
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) setCategories(data)
      })
  }, [editing, verticalFilter, verticals])

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(entry: Entry) {
    setEditing(entry)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  async function handleSave(input: EntryInput, id?: number) {
    if (id) {
      await adminUpdateEntry(id, input)
    } else {
      await adminCreateEntry(input)
    }
    closeForm()
    setEntries([])
    setCursor(null)
    loadEntries(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    try {
      await adminDeleteEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  const verticalName = (vid: number) => verticals.find((v) => v.id === vid)?.name ?? `#${vid}`
  const verticalSlug = (vid: number) => verticals.find((v) => v.id === vid)?.slug ?? ''

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Entry Editor</h1>
          <p className="admin-subtitle">Create, edit, and manage entries with SEO metadata controls.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
          + New Entry
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <select
          className="admin-select"
          value={verticalFilter ?? ''}
          onChange={(e) => updateParam('vertical', e.target.value || null)}
        >
          <option value="">All verticals</option>
          {verticals.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <select
          className="admin-select"
          value={statusFilter ?? ''}
          onChange={(e) => updateParam('status', e.target.value || null)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          className="admin-input admin-search-input"
          type="search"
          placeholder="Search title or slug…"
          value={searchQuery}
          onChange={(e) => updateParam('q', e.target.value || null)}
        />
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* Entry list */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Vertical</th>
              <th>Status</th>
              <th>Slug</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && entries.length === 0 ? (
              <tr><td colSpan={7} className="admin-empty">Loading…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={7} className="admin-empty">No entries found. Create one to get started.</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id}>
                  <td className="admin-num admin-muted">{e.id}</td>
                  <td>
                    <a
                      href={`/${verticalSlug(e.vertical_id)}/${e.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-entry-title"
                    >
                      {e.title}
                    </a>
                  </td>
                  <td><span className={`admin-vertical-dot dot-${verticalSlug(e.vertical_id)}`} />{verticalName(e.vertical_id)}</td>
                  <td><span className={`status-tag status-tag-${e.status}`}>{e.status}</span></td>
                  <td className="admin-slug">{e.slug}</td>
                  <td className="admin-muted admin-date">{new Date(e.updated_at).toLocaleDateString()}</td>
                  <td>
                    <button className="admin-btn admin-btn-sm" onClick={() => openEdit(e)}>Edit</button>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(e.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button className="admin-btn admin-btn-load" onClick={() => loadEntries(false)} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}

      {showForm && (
        <EntryFormModal
          entry={editing}
          verticals={verticals}
          categories={categories}
          defaultVerticalId={verticalFilter ?? undefined}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}
    </div>
  )
}

function EntryFormModal({
  entry,
  verticals,
  categories,
  defaultVerticalId,
  onSave,
  onCancel,
}: {
  entry: Entry | null
  verticals: Vertical[]
  categories: Category[]
  defaultVerticalId?: number
  onSave: (input: EntryInput, id?: number) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<EntryInput>(() => {
    if (entry) {
      return {
        vertical_id: entry.vertical_id,
        category_id: entry.category_id,
        slug: entry.slug,
        title: entry.title,
        summary: entry.summary,
        content: entry.content,
        status: entry.status,
        locale: entry.locale,
        source_url: entry.source_url,
        published_at: entry.published_at,
        metadata: entry.metadata,
      }
    }
    return {
      vertical_id: defaultVerticalId ?? verticals[0]?.id ?? 0,
      category_id: null,
      slug: '',
      title: '',
      summary: '',
      content: '',
      status: 'draft',
      locale: 'en',
      source_url: '',
      published_at: null,
      metadata: {},
    }
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // SEO metadata fields stored in the metadata JSONB column
  const seoMeta = (form.metadata ?? {}) as Record<string, string>
  const [metaTitle, setMetaTitle] = useState(seoMeta.seo_title ?? '')
  const [metaDescription, setMetaDescription] = useState(seoMeta.seo_description ?? '')
  const [metaKeywords, setMetaKeywords] = useState(seoMeta.seo_keywords ?? '')
  const [canonicalUrl, setCanonicalUrl] = useState(seoMeta.canonical_url ?? '')
  const [ogImage, setOgImage] = useState(seoMeta.og_image ?? '')

  function update<K extends keyof EntryInput>(key: K, value: EntryInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const metadata: Record<string, string> = {}
      if (metaTitle) metadata.seo_title = metaTitle
      if (metaDescription) metadata.seo_description = metaDescription
      if (metaKeywords) metadata.seo_keywords = metaKeywords
      if (canonicalUrl) metadata.canonical_url = canonicalUrl
      if (ogImage) metadata.og_image = ogImage

      const payload: EntryInput = {
        ...form,
        metadata,
        published_at: form.status === 'published' && !form.published_at
          ? new Date().toISOString()
          : form.published_at,
      }
      await onSave(payload, entry?.id)
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>{entry ? `Edit Entry #${entry.id}` : 'New Entry'}</h2>
          <button className="admin-modal-close" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={submit} className="admin-modal-body">
          {formError && <div className="admin-error">{formError}</div>}

          <fieldset className="admin-fieldset">
            <legend>Core Content</legend>

            <label className="admin-field">
              <span>Vertical</span>
              <select
                className="admin-select"
                value={form.vertical_id}
                onChange={(e) => update('vertical_id', Number(e.target.value))}
                required
              >
                {verticals.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Category</span>
              <select
                className="admin-select"
                value={form.category_id ?? ''}
                onChange={(e) => update('category_id', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Title</span>
              <input
                className="admin-input"
                type="text"
                value={form.title}
                onChange={(e) => {
                  update('title', e.target.value)
                  if (!entry) update('slug', slugify(e.target.value))
                }}
                required
              />
            </label>

            <label className="admin-field">
              <span>Slug (URL)</span>
              <input
                className="admin-input"
                type="text"
                value={form.slug}
                onChange={(e) => update('slug', slugify(e.target.value))}
                required
              />
              <small className="admin-field-hint">Auto-generated from title. Used in the page URL.</small>
            </label>

            <label className="admin-field">
              <span>Summary</span>
              <textarea
                className="admin-textarea"
                value={form.summary ?? ''}
                onChange={(e) => update('summary', e.target.value || null)}
                rows={2}
              />
              <small className="admin-field-hint">Short description shown in listings and search results.</small>
            </label>

            <label className="admin-field">
              <span>Content</span>
              <textarea
                className="admin-textarea admin-textarea-lg"
                value={form.content ?? ''}
                onChange={(e) => update('content', e.target.value || null)}
                rows={8}
              />
            </label>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend>Publishing</legend>

            <div className="admin-field-row">
              <label className="admin-field">
                <span>Status</span>
                <select
                  className="admin-select"
                  value={form.status}
                  onChange={(e) => update('status', e.target.value as EntryStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                <span>Locale</span>
                <input
                  className="admin-input"
                  type="text"
                  value={form.locale}
                  onChange={(e) => update('locale', e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="admin-field">
              <span>Source URL</span>
              <input
                className="admin-input"
                type="url"
                value={form.source_url ?? ''}
                onChange={(e) => update('source_url', e.target.value || null)}
              />
            </label>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend>SEO Metadata</legend>
            <small className="admin-fieldset-hint">
              Stored in the entry's metadata field. Controls how search engines and social platforms display this page.
            </small>

            <label className="admin-field">
              <span>SEO Title</span>
              <input
                className="admin-input"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={form.title || 'Defaults to entry title'}
              />
              <small className="admin-field-hint">Override the title for search engine results. Recommended: 50-60 characters.</small>
            </label>

            <label className="admin-field">
              <span>SEO Description</span>
              <textarea
                className="admin-textarea"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                placeholder={form.summary || 'Defaults to summary'}
              />
              <small className="admin-field-hint">Meta description for search results. Recommended: 150-160 characters.</small>
            </label>

            <label className="admin-field">
              <span>SEO Keywords</span>
              <input
                className="admin-input"
                type="text"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
              />
            </label>

            <div className="admin-field-row">
              <label className="admin-field">
                <span>Canonical URL</span>
                <input
                  className="admin-input"
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>

              <label className="admin-field">
                <span>OG Image URL</span>
                <input
                  className="admin-input"
                  type="url"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://…/image.jpg"
                />
              </label>
            </div>
          </fieldset>

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : entry ? 'Save changes' : 'Create entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
