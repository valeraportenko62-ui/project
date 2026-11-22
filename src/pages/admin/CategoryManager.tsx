import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  listRelationsWithEntries,
  createRelation,
  deleteRelation,
} from '../../lib/admin'
import { listCategories } from '../../lib/data'
import { useVerticals } from '../../hooks/useVerticals'
import type { Category, Entry, Relation, RelationType, Vertical } from '../../lib/types'

const RELATION_TYPES: RelationType[] = ['parent_child', 'related', 'cites', 'translates']

export default function CategoryManager() {
  const { verticals } = useVerticals()
  const [activeVerticalId, setActiveVerticalId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [relations, setRelations] = useState<(Relation & { parent_entry: Entry; child_entry: Entry })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Category form state
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catParent, setCatParent] = useState<number | null>(null)

  // Relation form state
  const [showRelForm, setShowRelForm] = useState(false)
  const [relParentId, setRelParentId] = useState<number | null>(null)
  const [relChildId, setRelChildId] = useState<number | null>(null)
  const [relType, setRelType] = useState<RelationType>('related')

  useEffect(() => {
    if (verticals.length > 0 && activeVerticalId === null) {
      setActiveVerticalId(verticals[0].id)
    }
  }, [verticals, activeVerticalId])

  useEffect(() => {
    if (activeVerticalId === null) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      listCategories(activeVerticalId),
      supabase
        .from('entries')
        .select('*')
        .eq('vertical_id', activeVerticalId)
        .order('id', { ascending: false })
        .limit(200)
        .then(({ data, error }) => {
          if (error) throw error
          return data ?? []
        }),
    ])
      .then(([cats, ents]) => {
        if (cancelled) return
        setCategories(cats)
        setEntries(ents)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [activeVerticalId])

  useEffect(() => {
    listRelationsWithEntries()
      .then(setRelations)
      .catch((err: Error) => setError(err.message))
  }, [])

  function slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
  }

  function openCreateCat() {
    setEditingCat(null)
    setCatName('')
    setCatSlug('')
    setCatParent(null)
    setShowCatForm(true)
  }

  function openEditCat(cat: Category) {
    setEditingCat(cat)
    setCatName(cat.name)
    setCatSlug(cat.slug)
    setCatParent(cat.parent_category_id)
    setShowCatForm(true)
  }

  async function saveCat(e: React.FormEvent) {
    e.preventDefault()
    if (!activeVerticalId) return
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, {
          name: catName,
          slug: catSlug || slugify(catName),
          parent_category_id: catParent,
        })
      } else {
        await createCategory({
          vertical_id: activeVerticalId,
          name: catName,
          slug: catSlug || slugify(catName),
          parent_category_id: catParent,
        })
      }
      setShowCatForm(false)
      const cats = await listCategories(activeVerticalId)
      setCategories(cats)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleDeleteCat(id: number) {
    if (!confirm('Delete this category? Entries in it will become uncategorized.')) return
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function saveRelation(e: React.FormEvent) {
    e.preventDefault()
    if (!relParentId || !relChildId) return
    if (relParentId === relChildId) {
      setError('Cannot link an entry to itself.')
      return
    }
    try {
      await createRelation({
        parent_entry_id: relParentId,
        child_entry_id: relChildId,
        relation_type: relType,
      })
      setShowRelForm(false)
      setRelParentId(null)
      setRelChildId(null)
      setRelType('related')
      const rels = await listRelationsWithEntries()
      setRelations(rels)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleDeleteRelation(id: number) {
    if (!confirm('Remove this cross-link?')) return
    try {
      await deleteRelation(id)
      setRelations((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const activeVertical: Vertical | undefined = verticals.find((v) => v.id === activeVerticalId)
  const entryLabel = (e: Entry) => `${e.title} (#${e.id})`

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Categories & Cross-links</h1>
          <p className="admin-subtitle">Manage category structure within each vertical and link related entries.</p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* Vertical selector tabs */}
      <div className="admin-tabs">
        {verticals.map((v) => (
          <button
            key={v.id}
            className={`admin-tab${activeVerticalId === v.id ? ' active' : ''}`}
            onClick={() => setActiveVerticalId(v.id)}
          >
            <span className={`admin-vertical-dot dot-${v.slug}`} />
            {v.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-loading">Loading categories…</div>
      ) : (
        <div className="admin-manager-grid">
          {/* Categories panel */}
          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2>Categories in {activeVertical?.name}</h2>
              <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={openCreateCat}>
                + Add category
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="admin-empty-panel">No categories yet.</div>
            ) : (
              <table className="admin-table admin-table-compact">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Parent</th>
                    <th>Entries</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => {
                    const parent = categories.find((p) => p.id === c.parent_category_id)
                    const entryCount = entries.filter((e) => e.category_id === c.id).length
                    return (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td className="admin-slug">{c.slug}</td>
                        <td className="admin-muted">{parent?.name ?? '—'}</td>
                        <td className="ta-center admin-num">{entryCount}</td>
                        <td>
                          <button className="admin-btn admin-btn-sm" onClick={() => openEditCat(c)}>Edit</button>
                          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDeleteCat(c.id)}>Delete</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {showCatForm && (
              <div className="admin-inline-form">
                <h3>{editingCat ? 'Edit category' : 'New category'}</h3>
                <form onSubmit={saveCat}>
                  <label className="admin-field">
                    <span>Name</span>
                    <input
                      className="admin-input"
                      type="text"
                      value={catName}
                      onChange={(e) => {
                        setCatName(e.target.value)
                        if (!editingCat) setCatSlug(slugify(e.target.value))
                      }}
                      required
                    />
                  </label>
                  <label className="admin-field">
                    <span>Slug</span>
                    <input
                      className="admin-input"
                      type="text"
                      value={catSlug}
                      onChange={(e) => setCatSlug(slugify(e.target.value))}
                      required
                    />
                  </label>
                  <label className="admin-field">
                    <span>Parent category</span>
                    <select
                      className="admin-select"
                      value={catParent ?? ''}
                      onChange={(e) => setCatParent(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">None (top-level)</option>
                      {categories
                        .filter((c) => c.id !== editingCat?.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </label>
                  <div className="admin-modal-actions">
                    <button type="button" className="admin-btn" onClick={() => setShowCatForm(false)}>Cancel</button>
                    <button type="submit" className="admin-btn admin-btn-primary">
                      {editingCat ? 'Save' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Cross-links panel */}
          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2>Cross-links (Relations)</h2>
              <button
                className="admin-btn admin-btn-sm admin-btn-primary"
                onClick={() => setShowRelForm(!showRelForm)}
                disabled={entries.length < 2}
              >
                + Add link
              </button>
            </div>

            {entries.length < 2 && (
              <div className="admin-empty-panel">Need at least 2 entries to create a cross-link.</div>
            )}

            {showRelForm && entries.length >= 2 && (
              <div className="admin-inline-form">
                <h3>New cross-link</h3>
                <form onSubmit={saveRelation}>
                  <label className="admin-field">
                    <span>Source entry (parent)</span>
                    <select
                      className="admin-select"
                      value={relParentId ?? ''}
                      onChange={(e) => setRelParentId(Number(e.target.value))}
                      required
                    >
                      <option value="">Select entry…</option>
                      {entries.map((e) => (
                        <option key={e.id} value={e.id}>{entryLabel(e)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>Target entry (child)</span>
                    <select
                      className="admin-select"
                      value={relChildId ?? ''}
                      onChange={(e) => setRelChildId(Number(e.target.value))}
                      required
                    >
                      <option value="">Select entry…</option>
                      {entries.map((e) => (
                        <option key={e.id} value={e.id}>{entryLabel(e)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>Relation type</span>
                    <select
                      className="admin-select"
                      value={relType}
                      onChange={(e) => setRelType(e.target.value as RelationType)}
                    >
                      {RELATION_TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </label>
                  <div className="admin-modal-actions">
                    <button type="button" className="admin-btn" onClick={() => setShowRelForm(false)}>Cancel</button>
                    <button type="submit" className="admin-btn admin-btn-primary">Create link</button>
                  </div>
                </form>
              </div>
            )}

            {relations.length > 0 ? (
              <table className="admin-table admin-table-compact">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Type</th>
                    <th>Target</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {relations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.parent_entry.title}</td>
                      <td><span className="admin-rel-type">{r.relation_type.replace('_', ' ')}</span></td>
                      <td>{r.child_entry.title}</td>
                      <td>
                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDeleteRelation(r.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              !showRelForm && <div className="admin-empty-panel">No cross-links yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
