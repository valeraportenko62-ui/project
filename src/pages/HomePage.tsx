import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEntries, getPublicStats, listCategories } from '../lib/data'
import { useVerticals } from '../hooks/useVerticals'
import type { Category, Entry, Vertical } from '../lib/types'
import EntryCard, { EntryCardSkeleton } from '../components/EntryCard'
import { VerticalIcon, ArrowRightIcon, DatabaseIcon, SparklesIcon } from '../components/Icons'

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

export default function HomePage() {
  const { verticals } = useVerticals()
  const [latest, setLatest] = useState<Entry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [totalEntries, setTotalEntries] = useState(0)
  const [loadingLatest, setLoadingLatest] = useState(true)
  const [catMap, setCatMap] = useState<Record<number, Category[]>>({})

  useEffect(() => {
    getPublicStats().then((s) => setTotalEntries(s.totalEntries)).catch(() => {})
  }, [])

  useEffect(() => {
    if (verticals.length === 0) return
    setLoadingLatest(true)
    Promise.all(
      verticals.map((v: Vertical) => listEntries({ verticalId: v.id, status: 'published', limit: 2 }))
    )
      .then((pages) => setLatest(pages.flatMap((p) => p.items).slice(0, 8)))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingLatest(false))
  }, [verticals])

  useEffect(() => {
    if (verticals.length === 0) return
    Promise.all(verticals.map((v) => listCategories(v.id).then((cats) => [v.id, cats] as const)))
      .then((pairs) => {
        const map: Record<number, Category[]> = {}
        for (const [id, cats] of pairs) map[id] = cats
        setCatMap(map)
      })
      .catch(() => {})
  }, [verticals])

  const animatedCount = useCountUp(totalEntries)

  return (
    <div>
      {/* Executive Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <span className="hero-eyebrow">
            <SparklesIcon size={14} />
            <span>Six verticals. One platform.</span>
          </span>
          <h1 className="hero-title">Knowledge across every vertical</h1>
          <p className="hero-desc">
            Guides, references, lessons, encyclopedia articles, catalogs, and scientific summaries —
            all unified under a single domain with billion-record scale architecture.
          </p>

          <div className="hero-counter">
            <div className="hero-counter-num">
              <DatabaseIcon size={20} />
              <span className="counter-value">{animatedCount.toLocaleString()}</span>
            </div>
            <span className="hero-counter-label">records indexed across all verticals</span>
          </div>
        </div>
      </section>

      {error && <div className="status error">Something went wrong: {error}</div>}

      {/* Vertical Grid */}
      <section className="home-section">
        <div className="home-section-head">
          <h2>Browse by vertical</h2>
          <span className="home-section-sub">{verticals.length} verticals · 65M+ target records</span>
        </div>
        <div className="vertical-grid">
          {verticals.map((v) => {
            const cats = catMap[v.id] ?? []
            return (
              <Link key={v.id} to={`/${v.slug}`} className={`vcard vp-${v.slug}`}>
                <div className="vcard-head">
                  <span className="vcard-icon">
                    <VerticalIcon slug={v.slug} size={22} />
                  </span>
                  <ArrowRightIcon size={18} className="vcard-arrow" />
                </div>
                <h3>{v.name}</h3>
                <p>{v.description}</p>
                <div className="vcard-stats">
                  <span className="vcard-target">{v.target_volume} target</span>
                  <span className="vcard-cats">{cats.length} categories</span>
                </div>
                {cats.length > 0 && (
                  <div className="vcard-pills">
                    {cats.slice(0, 3).map((c) => (
                      <span key={c.id} className="vcard-pill">{c.name}</span>
                    ))}
                    {cats.length > 3 && <span className="vcard-pill vcard-pill-more">+{cats.length - 3}</span>}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Latest entries */}
      <section className="home-section">
        <div className="home-section-head">
          <h2>Latest across all verticals</h2>
          <Link to="/search" className="home-section-link">View all <ArrowRightIcon size={15} /></Link>
        </div>
        {loadingLatest ? (
          <div className="entry-grid">
            {Array.from({ length: 4 }).map((_, i) => <EntryCardSkeleton key={i} />)}
          </div>
        ) : latest.length === 0 ? (
          <div className="status">No entries published yet.</div>
        ) : (
          <div className="entry-grid">
            {latest.map((e) => {
              const v = verticals.find((v) => v.id === e.vertical_id)
              return <EntryCard key={e.id} entry={e} vertical={v} />
            })}
          </div>
        )}
      </section>
    </div>
  )
}
