import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getVerticalBySlug, listCategories, listEntries } from '../lib/data'
import type { Category, Entry, Vertical } from '../lib/types'
import EntryCard, { EntryCardSkeleton } from '../components/EntryCard'
import { VerticalIcon, ArrowDownIcon } from '../components/Icons'
import NotFoundPage from './NotFoundPage'

const PAGE_SIZE = 12

export default function VerticalPage() {
  const { verticalSlug } = useParams<{ verticalSlug: string }>()
  const [vertical, setVertical] = useState<Vertical | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setEntries([])
    setCursor(null)
    setCategoryId(null)
    getVerticalBySlug(verticalSlug ?? '')
      .then((v) => {
        if (cancelled) return
        if (!v) {
          setNotFound(true)
          return
        }
        setVertical(v)
        return listCategories(v.id).then((cats) => {
          if (!cancelled) setCategories(cats)
        })
      })
      .catch((err: Error) => !cancelled && setError(err.message))
  }, [verticalSlug])

  useEffect(() => {
    if (!vertical) return
    let cancelled = false
    setLoading(true)
    listEntries({ verticalId: vertical.id, categoryId: categoryId ?? undefined, limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return
        setEntries(page.items)
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [vertical, categoryId])

  async function loadMore() {
    if (!vertical || cursor == null) return
    setLoadingMore(true)
    try {
      const page = await listEntries({
        verticalId: vertical.id,
        categoryId: categoryId ?? undefined,
        cursor,
        limit: PAGE_SIZE,
      })
      setEntries((prev) => [...prev, ...page.items])
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingMore(false)
    }
  }

  if (notFound) return <NotFoundPage />
  if (error) return <div className="status error">Something went wrong: {error}</div>
  if (!vertical) return <div className="status">Loading…</div>

  const activeCat = categories.find((c) => c.id === categoryId)

  return (
    <div>
      <div className={`vertical-hero vp-${vertical.slug}`}>
        <div className="vertical-hero-content">
          <div className="vertical-hero-icon">
            <VerticalIcon slug={vertical.slug} size={28} />
          </div>
          <div>
            <h1>{vertical.name}</h1>
            <p>{vertical.description}</p>
          </div>
        </div>
        <span className="vertical-hero-target">{vertical.target_volume} target</span>
      </div>

      <div className="filter-row" role="group" aria-label="Filter by category">
        <button
          className={categoryId === null ? 'filter-chip active' : 'filter-chip'}
          onClick={() => setCategoryId(null)}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={categoryId === c.id ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setCategoryId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="entry-grid">
          {Array.from({ length: 6 }).map((_, i) => <EntryCardSkeleton key={i} />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <h3>No entries in this view yet.</h3>
          <p>{activeCat ? `The "${activeCat.name}" category has no published entries.` : 'This vertical has no published entries yet.'}</p>
        </div>
      ) : (
        <div className="entry-list">
          {entries.map((e) => {
            const cat = categories.find((c) => c.id === e.category_id)
            return (
              <Link
                key={e.id}
                to={
                  cat
                    ? `/${vertical.slug}/${cat.slug}/${e.slug}`
                    : `/${vertical.slug}/_/latest/${e.slug}`
                }
                className="entry-list-link"
              >
                <EntryCard entry={e} category={cat?.name} />
              </Link>
            )
          })}
        </div>
      )}

      {hasMore && (
        <button className="load-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? (
            <><span className="spinner" /> Loading…</>
          ) : (
            <><ArrowDownIcon size={16} /> Load more entries</>
          )}
        </button>
      )}
    </div>
  )
}
