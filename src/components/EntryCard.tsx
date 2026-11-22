import type { Entry, Vertical } from '../lib/types'

export default function EntryCard({ entry, vertical }: { entry: Entry; vertical?: Vertical }) {
  return (
    <article className="entry-card">
      {vertical && <span className="entry-vertical">{vertical.name}</span>}
      <h3>{entry.title}</h3>
      <p>{entry.summary}</p>
      <div className="entry-meta">
        <span>{new Date(entry.published_at ?? entry.created_at).toLocaleDateString()}</span>
        <span className="status-chip">{entry.status}</span>
      </div>
    </article>
  )
}
