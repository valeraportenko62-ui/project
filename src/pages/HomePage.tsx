import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEntries } from '../lib/data'
import { useVerticals } from '../hooks/useVerticals'
import type { Entry, Vertical } from '../lib/types'
import EntryCard from '../components/EntryCard'

export default function HomePage() {
  const { verticals } = useVerticals()
  const [latest, setLatest] = useState<Entry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (verticals.length === 0) return
    Promise.all(
      verticals.map((v: Vertical) => listEntries({ verticalId: v.id, status: 'published', limit: 2 }))
    )
      .then((pages) => setLatest(pages.flatMap((p) => p.items).slice(0, 8)))
      .catch((err: Error) => setError(err.message))
  }, [verticals])

  return (
    <div>
      <section className="hero">
        <h2>Knowledge across every vertical</h2>
        <p>
          Guides, references, lessons, encyclopedia articles, catalogs, and scientific summaries —
          all in one place.
        </p>
      </section>

      {error && <div className="status error">Something went wrong: {error}</div>}

      <section>
        <h3 className="section-title">Latest across all verticals</h3>
        {latest.length === 0 ? (
          <div className="status">Loading…</div>
        ) : (
          <div className="entry-grid">
            {latest.map((e) => {
              const v = verticals.find((v) => v.id === e.vertical_id)
              return (
                <EntryCard key={e.id} entry={e} vertical={v} />
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="section-title">Browse by vertical</h3>
        <div className="vertical-cards">
          {verticals.map((v) => (
            <Link key={v.id} to={`/${v.slug}`} className="vertical-card">
              <strong>{v.name}</strong>
              <span className="volume">{v.target_volume} records target</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
