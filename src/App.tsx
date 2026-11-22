import { useEffect, useState } from 'react'
import { listVerticals, listEntries } from './lib/data'
import type { Entry, Vertical } from './lib/types'

export default function App() {
  const [verticals, setVerticals] = useState<Vertical[]>([])
  const [selected, setSelected] = useState<Vertical | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listVerticals()
      .then((rows) => {
        setVerticals(rows)
        if (rows.length > 0) setSelected(rows[0])
        else setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    setCursor(null)
    listEntries({ verticalId: selected.id, limit: 10 })
      .then((page) => {
        setEntries(page.items)
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [selected])

  async function loadMore() {
    if (!selected || cursor == null) return
    setLoading(true)
    try {
      const page = await listEntries({ verticalId: selected.id, cursor, limit: 10 })
      setEntries((prev) => [...prev, ...page.items])
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (error) return <div className="status error">Something went wrong: {error}</div>

  return (
    <div className="shell">
      <header className="masthead">
        <h1>CENTRAL WEBSITE</h1>
        <p className="tagline">One domain. Six knowledge verticals.</p>
      </header>

      <nav className="vertical-nav" aria-label="Verticals">
        {verticals.map((v) => (
          <button
            key={v.id}
            className={selected?.id === v.id ? 'vertical-btn active' : 'vertical-btn'}
            onClick={() => setSelected(v)}
          >
            {v.name}
            <span className="volume">{v.target_volume}</span>
          </button>
        ))}
      </nav>

      <main>
        {selected && (
          <>
            <div className="section-head">
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
            </div>

            {loading && entries.length === 0 ? (
              <div className="status">Loading…</div>
            ) : entries.length === 0 ? (
              <div className="status">No entries yet in this vertical.</div>
            ) : (
              <ul className="entry-list">
                {entries.map((e) => (
                  <li key={e.id} className="entry-card">
                    <h3>{e.title}</h3>
                    <p>{e.summary}</p>
                    <div className="entry-meta">
                      <span>{new Date(e.published_at ?? e.created_at).toLocaleDateString()}</span>
                      <span className="status-chip">{e.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {hasMore && (
              <button className="load-more" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
