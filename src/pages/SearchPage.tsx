import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchEntries } from '../lib/data'
import { useVerticals } from '../hooks/useVerticals'
import type { SearchHit } from '../lib/types'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const { verticals } = useVerticals()
  const [verticalId, setVerticalId] = useState<number | null>(null)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
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
    searchEntries({ query: q, verticalId: verticalId ?? undefined, limit: 20 })
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
    return () => {
      cancelled = true
    }
  }, [q, verticalId])

  async function loadMore() {
    if (!q || cursor == null) return
    setLoading(true)
    try {
      const page = await searchEntries({ query: q, verticalId: verticalId ?? undefined, cursor, limit: 20 })
      setHits((prev) => [...prev, ...page.items])
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Search results</h2>
        <p>
          {q ? (
            <>
              Showing results for "<strong>{q}</strong>"
            </>
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
            {v.name}
          </button>
        ))}
      </div>

      {error && <div className="status error">Something went wrong: {error}</div>}

      {!error && loading && hits.length === 0 && <div className="status">Searching…</div>}

      {!error && !loading && q && hits.length === 0 && (
        <div className="status">No results for "{q}". Try a different wording.</div>
      )}

      <div className="entry-list">
        {hits.map((h) => {
          const v = verticals.find((v) => v.id === h.vertical_id)
          return (
            <Link
              key={h.id}
              to={v ? `/${v.slug}/_/${h.slug}` : '/'}
              className="entry-list-item"
            >
              <article className="entry-card">
                {v && <span className="entry-vertical">{v.name}</span>}
                <h3>{h.title}</h3>
                <p>{h.summary}</p>
              </article>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <button className="load-more" onClick={loadMore} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
