import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEntry, getVerticalBySlug, listCategories, listRelatedEntries } from '../lib/data'
import type { Category, Entry, Vertical } from '../lib/types'
import NotFoundPage from './NotFoundPage'

export default function EntryPage() {
  const { verticalSlug, categorySlug, slugOrId } = useParams<{
    verticalSlug: string
    categorySlug: string
    slugOrId: string
  }>()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [vertical, setVertical] = useState<Vertical | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [related, setRelated] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setEntry(null)
    setRelated([])
    ;(async () => {
      try {
        const v = await getVerticalBySlug(verticalSlug ?? '')
        if (!v) {
          if (!cancelled) setNotFound(true)
          return
        }
        const e = await getEntry(v.id, slugOrId ?? '')
        if (!e) {
          if (!cancelled) setNotFound(true)
          return
        }
        const cats = await listCategories(v.id)
        const cat = cats.find((c) => c.id === e.category_id) ?? null
        const rel = await listRelatedEntries(e.id)
        if (!cancelled) {
          setVertical(v)
          setEntry(e)
          setCategory(cat)
          setRelated(rel)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [verticalSlug, categorySlug, slugOrId])

  if (notFound) return <NotFoundPage />
  if (error) return <div className="status error">Something went wrong: {error}</div>
  if (loading || !entry || !vertical) return <div className="status">Loading…</div>

  return (
    <article className={`entry-detail template-${vertical.slug}`}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> / <Link to={`/${vertical.slug}`}>{vertical.name}</Link>
        {category && <span> / {category.name}</span>}
      </nav>

      <header className="entry-header">
        <span className={`entry-badge badge-${vertical.slug}`}>{vertical.name}</span>
        {category && <span className="entry-badge">{category.name}</span>}
        <h2>{entry.title}</h2>
        {entry.summary && <p className="entry-standfirst">{entry.summary}</p>}
        <div className="entry-meta">
          <span>Published {new Date(entry.published_at ?? entry.created_at).toLocaleDateString()}</span>
          {entry.source_url && (
            <a href={entry.source_url} target="_blank" rel="noreferrer">
              Source
            </a>
          )}
        </div>
      </header>

      <div className="entry-body">{entry.content ?? 'No content available yet.'}</div>

      {related.length > 0 && (
        <section className="related">
          <h3 className="section-title">Related</h3>
          <div className="entry-grid">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/${vertical.slug}/${category?.slug ?? '_'}/${r.slug}`}
                className="entry-list-item"
              >
                <strong>{r.title}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
