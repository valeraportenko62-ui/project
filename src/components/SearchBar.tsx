import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { searchEntries } from '../lib/data'
import { useVerticals } from '../hooks/useVerticals'
import type { SearchHit } from '../lib/types'
import { SearchIcon, CornerDownLeftIcon } from './Icons'

export default function SearchBar() {
  const { verticals } = useVerticals()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
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
          setActiveIdx(-1)
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || hits.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((prev) => Math.min(prev + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      const hit = hits[activeIdx]
      const v = verticals.find((v) => v.id === hit.vertical_id)
      if (v) {
        setOpen(false)
        navigate(`/${v.slug}/${hit.slug}`)
      }
    }
  }

  const vName = (vid: number) => verticals.find((v) => v.id === vid)?.name ?? ''
  const vSlug = (vid: number) => verticals.find((v) => v.id === vid)?.slug ?? ''

  return (
    <div className="search-box" ref={boxRef}>
      <form onSubmit={submit} className="search-form">
        <SearchIcon className="search-icon" size={18} />
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder="Search all verticals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search"
        />
        <kbd className="search-kbd">⌘K</kbd>
      </form>
      {open && (
        <div className="search-dropdown">
          {loading && <div className="search-note">Searching…</div>}
          {!loading && hits.length === 0 && query.trim().length >= 2 && (
            <div className="search-note">
              No matches found. Press <kbd className="search-kbd-sm">Enter</kbd> for full results.
            </div>
          )}
          {!loading &&
            hits.map((h, i) => (
              <Link
                key={h.id}
                to={`/${vSlug(h.vertical_id)}/${h.slug}`}
                className={`search-hit${i === activeIdx ? ' active' : ''}`}
                onClick={() => {
                  setOpen(false)
                  setActiveIdx(-1)
                }}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <span className={`search-hit-badge vp-${vSlug(h.vertical_id)}`}>
                  {vName(h.vertical_id)}
                </span>
                <span className="search-hit-title">{h.title}</span>
                {h.summary && <span className="search-hit-summary">{h.summary}</span>}
                {i === activeIdx && <CornerDownLeftIcon size={14} className="search-hit-enter" />}
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
