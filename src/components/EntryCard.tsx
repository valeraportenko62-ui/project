import type { Entry, Vertical } from '../lib/types'
import { ClockIcon, TagIcon, ChevronRightIcon } from './Icons'

export default function EntryCard({ entry, vertical, category }: { entry: Entry; vertical?: Vertical; category?: string }) {
  const date = new Date(entry.published_at ?? entry.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article className="entry-card">
      {(vertical || category) && (
        <div className="entry-card-tags">
          {vertical && (
            <span className={`entry-vert-tag vp-${vertical.slug}`}>
              {vertical.name}
            </span>
          )}
          {category && (
            <span className="entry-cat-tag">
              <TagIcon size={11} />
              {category}
            </span>
          )}
        </div>
      )}
      <h3>{entry.title}</h3>
      {entry.summary && <p>{entry.summary}</p>}
      <div className="entry-card-footer">
        <span className="entry-card-date">
          <ClockIcon size={13} />
          {date}
        </span>
        <span className={`entry-status entry-status-${entry.status}`}>{entry.status}</span>
      </div>
      <ChevronRightIcon size={16} className="entry-card-chevron" />
    </article>
  )
}

export function EntryCardSkeleton() {
  return (
    <div className="entry-card skeleton">
      <div className="skeleton-line skeleton-tag" />
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-text" />
      <div className="skeleton-line skeleton-text short" />
      <div className="skeleton-line skeleton-footer" />
    </div>
  )
}
