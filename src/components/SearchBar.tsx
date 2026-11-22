import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { searchEntries } from '../lib/data'
import type { SearchHit } from '../lib/types'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.trim().length < 2) {
      setHits([])
      setLoading(false)
      return
    }
    setLoading(true)
    timerRef.current = setTimeout(() => {
      searchEntries({ query: query.trim(), limit: 8 })
        .then((page) => {
          setHits(page.items)
          setOpen(true)
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      setOpen(false)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="search-box" ref={boxRef}>
      <form onSubmit={submit}>
        <input
          type="search"
          className="search-input"
          placeholder="Search all verticals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
        />
      </form>
      {open && (
        <div className="search-dropdown">
          {loading && <div className="search-note">Searching…</div>}
          {!loading && hits.length === 0 && (
            <div className="search-note">No matches. Press Enter for full results.</div>
          )}
          {!loading &&
            hits.map((h) => (
              <Link
                key={h.id}
                to={`/${h.vertical_id}/${h.slug}`}
                className="search-hit"
                onClick={() => setOpen(false)}
              >
                <span className="search-hit-title">{h.title}</span>
                {h.summary && <span className="search-hit-summary">{h.summary}</span>}
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
