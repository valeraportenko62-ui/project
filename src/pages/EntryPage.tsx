import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEntry, getVerticalBySlug, listCategories, listRelatedEntries } from '../lib/data'
import type { Category, Entry, Vertical } from '../lib/types'
import { ExternalLinkIcon, ClockIcon, TagIcon, ChevronRightIcon } from '../components/Icons'
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
    return () => { cancelled = true }
  }, [verticalSlug, categorySlug, slugOrId])

  if (notFound) return <NotFoundPage />
  if (error) return <div className="status error">Something went wrong: {error}</div>
  if (loading || !entry || !vertical) return <div className="status">Loading…</div>

  const date = new Date(entry.published_at ?? entry.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article className={`entry-detail vp-${vertical.slug}`}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRightIcon size={13} />
        <Link to={`/${vertical.slug}`}>{vertical.name}</Link>
        {category && (
          <>
            <ChevronRightIcon size={13} />
            <span>{category.name}</span>
          </>
        )}
      </nav>

      <header className="entry-header">
        <div className="entry-header-tags">
          <span className={`entry-vert-tag vp-${vertical.slug}`}>{vertical.name}</span>
          {category && (
            <span className="entry-cat-tag">
              <TagIcon size={11} />
              {category.name}
            </span>
          )}
        </div>
        <h1>{entry.title}</h1>
        {entry.summary && <p className="entry-standfirst">{entry.summary}</p>}
        <div className="entry-header-meta">
          <span className="entry-meta-item">
            <ClockIcon size={14} />
            Published {date}
          </span>
          {entry.source_url && (
            <a href={entry.source_url} target="_blank" rel="noreferrer" className="entry-meta-link">
              <ExternalLinkIcon size={14} />
              Source
            </a>
          )}
          <span className="entry-meta-locale">{entry.locale}</span>
        </div>
      </header>

      <div className="entry-body">{entry.content ?? 'No content available yet.'}</div>

      {related.length > 0 && (
        <section className="related">
          <h2 className="related-title">Related entries</h2>
          <div className="related-grid">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/${vertical.slug}/${category?.slug ?? '_'}/${r.slug}`}
                className="related-item"
              >
                <span className="related-item-title">{r.title}</span>
                {r.summary && <span className="related-item-summary">{r.summary}</span>}
                <span className="related-item-arrow"><ChevronRightIcon size={15} /></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
