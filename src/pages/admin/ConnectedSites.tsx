import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useVerticals } from '../../hooks/useVerticals'
import { ExternalLinkIcon } from '../../components/Icons'
import type { Vertical } from '../../lib/types'

interface ConnectedSite {
  id: number
  name: string
  url: string
  category: string
  vertical_id: number | null
  status: 'active' | 'dev' | 'paused'
  notes: string | null
  created_at: string
}

const STATUS_ORDER: ConnectedSite['status'][] = ['active', 'dev', 'paused']

const STATUS_LABEL: Record<ConnectedSite['status'], string> = {
  active: 'Active',
  dev: 'In Dev',
  paused: 'Paused',
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function sortSites(list: ConnectedSite[]): ConnectedSite[] {
  return [...list].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  )
}

export default function ConnectedSites() {
  const { verticals } = useVerticals()
  const [sites, setSites] = useState<ConnectedSite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  const [verticalId, setVerticalId] = useState<string>('')
  const [status, setStatus] = useState<ConnectedSite['status']>('active')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    supabase
      .from('connected_sites')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setSites((data ?? []) as ConnectedSite[])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  function refresh() {
    setLoading(true)
    setError(null)
    supabase
      .from('connected_sites')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setSites((data ?? []) as ConnectedSite[])
        setLoading(false)
      })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!name.trim() || !url.trim()) {
      setFormError('Name and URL are required.')
      return
    }
    setSaving(true)
    const { data, error: err } = await supabase
      .from('connected_sites')
      .insert({
        name: name.trim(),
        url: normalizeUrl(url),
        category: category.trim() || 'General',
        vertical_id: verticalId ? Number(verticalId) : null,
        status,
        notes: notes.trim() || null,
      })
      .select('*')
      .single()
    setSaving(false)
    if (err) {
      setFormError(err.message)
      return
    }
    setSites((prev) => sortSites([...prev, data as ConnectedSite]))
    setName('')
    setUrl('')
    setCategory('')
    setVerticalId('')
    setStatus('active')
    setNotes('')
  }

  async function toggleStatus(site: ConnectedSite) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(site.status) + 1) % STATUS_ORDER.length]
    setSites((prev) => prev.map((s) => (s.id === site.id ? { ...s, status: next } : s)))
    const { error: err } = await supabase
      .from('connected_sites')
      .update({ status: next })
      .eq('id', site.id)
    if (err) {
      setSites((prev) => prev.map((s) => (s.id === site.id ? { ...s, status: site.status } : s)))
      setError(err.message)
    }
  }

  async function handleDelete(site: ConnectedSite) {
    if (!window.confirm(`Delete "${site.name}" from the directory?`)) return
    setSites((prev) => prev.filter((s) => s.id !== site.id))
    const { error: err } = await supabase.from('connected_sites').delete().eq('id', site.id)
    if (err) {
      setSites((prev) => sortSites([...prev, site]))
      setError(err.message)
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(sites.map((s) => s.category))).sort(),
    [sites],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sites.filter((s) => {
      if (filterCategory && s.category !== filterCategory) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
    })
  }, [sites, filterCategory, search])

  const grouped = useMemo(() => {
    const map = new Map<string, ConnectedSite[]>()
    for (const s of visible) {
      const list = map.get(s.category) ?? []
      list.push(s)
      map.set(s.category, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [visible])

  const verticalById = useMemo(() => {
    const map = new Map<number, Vertical>()
    for (const v of verticals) map.set(v.id, v)
    return map
  }, [verticals])

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Connected Sites</h1>
          <p className="admin-subtitle">
            Your directory of external websites, organized by category and ready to open in one click.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          {error} <button className="admin-btn admin-btn-sm" onClick={refresh}>Retry</button>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-head">
          <h2>Add a site</h2>
        </div>
        <form className="admin-panel" onSubmit={handleAdd} style={{ display: 'grid', gap: '0.85rem' }}>
          <div className="admin-field-row">
            <label className="admin-field">
              <span>Name *</span>
              <input
                className="admin-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MDN Web Docs"
              />
            </label>
            <label className="admin-field">
              <span>URL *</span>
              <input
                className="admin-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="developer.mozilla.org"
              />
            </label>
          </div>
          <div className="admin-field-row">
            <label className="admin-field">
              <span>Category</span>
              <input
                className="admin-input"
                list="connected-site-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="General"
              />
              <datalist id="connected-site-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
              <span className="admin-field-hint">Pick an existing category or type a new one.</span>
            </label>
            <label className="admin-field">
              <span>Vertical</span>
              <select
                className="admin-select"
                value={verticalId}
                onChange={(e) => setVerticalId(e.target.value)}
              >
                <option value="">— None —</option>
                {verticals.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
          </div>
          <div className="admin-field-row">
            <label className="admin-field">
              <span>Status</span>
              <select
                className="admin-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ConnectedSite['status'])}
              >
                <option value="active">Active</option>
                <option value="dev">In Dev</option>
                <option value="paused">Paused</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Notes</span>
              <input
                className="admin-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional reminder…"
              />
            </label>
          </div>
          {formError && <div className="admin-error">{formError}</div>}
          <div>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add site'}
            </button>
            <span className="admin-field-hint" style={{ marginLeft: '0.75rem' }}>
              https:// is added automatically if you leave it off.
            </span>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <div className="admin-section-head">
          <h2>Directory</h2>
          <input
            className="admin-input admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or URL…"
          />
        </div>

        <div className="admin-filters">
          <button
            type="button"
            className={filterCategory === null ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setFilterCategory(null)}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              className={filterCategory === c ? 'filter-chip active' : 'filter-chip'}
              onClick={() => setFilterCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {loading && <div className="admin-loading">Loading sites…</div>}

        {!loading && grouped.length === 0 && (
          <div className="admin-empty">
            {sites.length === 0
              ? 'No sites yet — add your first one above.'
              : 'No sites match this filter.'}
          </div>
        )}

        {grouped.map(([cat, list]) => (
          <div key={cat} className="admin-panel" style={{ marginBottom: '1rem' }}>
            <div className="admin-panel-head">
              <h2>{cat}</h2>
              <span className="admin-muted">{list.length} site{list.length === 1 ? '' : 's'}</span>
            </div>
            <div className="sites-grid">
              {list.map((site) => {
                const vertical = site.vertical_id != null ? verticalById.get(site.vertical_id) : undefined
                return (
                  <div key={site.id} className="site-card">
                    <div className="site-card-head">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="site-card-link"
                        title={site.url}
                      >
                        {site.name}
                        <ExternalLinkIcon size={13} />
                      </a>
                      <button
                        type="button"
                        className={`status-tag status-tag-${site.status} site-status-toggle`}
                        onClick={() => toggleStatus(site)}
                        title="Click to cycle status: active → in dev → paused"
                      >
                        {STATUS_LABEL[site.status]}
                      </button>
                    </div>
                    <div className="site-card-meta">
                      {vertical && (
                        <span className={`admin-ingestion-pill dot-badge-${vertical.slug}`}>
                          {vertical.name}
                        </span>
                      )}
                      <span className="admin-slug">{site.url.replace(/^https?:\/\//i, '')}</span>
                    </div>
                    {site.notes && <p className="site-card-notes">{site.notes}</p>}
                    <div className="site-card-footer">
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        onClick={() => toggleStatus(site)}
                      >
                        Cycle status
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(site)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
