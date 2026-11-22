import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchEntries } from '../lib/data'
import { useVerticals } from '../hooks/useVerticals'
import type { SearchHit } from '../lib/types'
import { SearchIcon, ArrowDownIcon } from '../components/Icons'

const PAGE_SIZE = 20

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const { verticals } = useVerticals()
  const [verticalId, setVerticalId] = useState<number | null>(null)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setHits([])
    setCursor(null)
    if (!q) {
      setLoading(false)
      return
    }
    searchEntries({ query: q, verticalId: verticalId ?? undefined, limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return
        setHits(page.items)
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
  }, [q, verticalId])

  async function loadMore() {
    if (!q || cursor == null) return
    setLoadingMore(true)
    try {
      const page = await searchEntries({ query: q, verticalId: verticalId ?? undefined, cursor, limit: PAGE_SIZE })
      setHits((prev) => [...prev, ...page.items])
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingMore(false)
    }
  }

  const vName = (vid: number) => verticals.find((v) => v.id === vid)?.name ?? ''
  const vSlug = (vid: number) => verticals.find((v) => v.id === vid)?.slug ?? ''

  return (
    <div>
      <div className="search-page-head">
        <h1>Search results</h1>
        <p>
          {q ? (
            <>Showing results for <strong>"{q}"</strong></>
          ) : (
            'Type a query in the search bar above.'
          )}
        </p>
      </div>

      <div className="filter-row" role="group" aria-label="Filter results by vertical">
        <button
          className={verticalId === null ? 'filter-chip active' : 'filter-chip'}
          onClick={() => setVerticalId(null)}
        >
          All verticals
        </button>
        {verticals.map((v) => (
          <button
            key={v.id}
            className={verticalId === v.id ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setVerticalId(v.id)}
          >
            <span className={`vp-dot vp-${v.slug}`} />
            {v.name}
          </button>
        ))}
      </div>

      {error && <div className="status error">Something went wrong: {error}</div>}

      {!error && loading && hits.length === 0 && (
        <div className="empty-state">
          <SearchIcon size={32} className="search-pulse" />
          <h3>Searching…</h3>
        </div>
      )}

      {!error && !loading && q && hits.length === 0 && (
        <div className="empty-state">
          <h3>No results for "{q}"</h3>
          <p>Try a different wording or browse <Link to="/">verticals</Link> directly.</p>
        </div>
      )}

      <div className="entry-list">
        {hits.map((h) => {
          const v = verticals.find((v) => v.id === h.vertical_id)
          return (
            <Link
              key={h.id}
              to={v ? `/${v.slug}/_/${h.slug}` : '/'}
              className="entry-list-link"
            >
              <article className="entry-card">
                {v && (
                  <div className="entry-card-tags">
                    <span className={`entry-vert-tag vp-${v.slug}`}>{v.name}</span>
                  </div>
                )}
                <h3>{h.title}</h3>
                {h.summary && <p>{h.summary}</p>}
              </article>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <button className="load-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? (
            <><span className="spinner" /> Loading…</>
          ) : (
            <><ArrowDownIcon size={16} /> Load more results</>
          )}
        </button>
      )}
    </div>
  )
}
