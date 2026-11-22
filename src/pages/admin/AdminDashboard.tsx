import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminStats,
  getScaleReadiness,
  parseTargetVolume,
  formatNumber,
  getTrafficSummary,
  getTrafficByVertical,
  getTopPages,
} from '../../lib/admin'
import type {
  AdminStats,
  VerticalStat,
  TrafficSummary,
  VerticalTrafficRow,
  TopPageRow,
} from '../../lib/admin'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [traffic, setTraffic] = useState<TrafficSummary | null>(null)
  const [verticalTraffic, setVerticalTraffic] = useState<VerticalTrafficRow[]>([])
  const [topPages, setTopPages] = useState<TopPageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getAdminStats(),
      getTrafficSummary(),
      getTrafficByVertical(),
      getTopPages(),
    ])
      .then(([s, t, tv, tp]) => {
        if (cancelled) return
        setStats(s)
        setTraffic(t)
        setVerticalTraffic(tv)
        setTopPages(tp)
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  function refresh() {
    setLoading(true)
    setError(null)
    Promise.all([
      getAdminStats(),
      getTrafficSummary(),
      getTrafficByVertical(),
      getTopPages(),
    ])
      .then(([s, t, tv, tp]) => {
        setStats(s)
        setTraffic(t)
        setVerticalTraffic(tv)
        setTopPages(tp)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (loading && !stats) return <div className="admin-loading">Loading dashboard…</div>
  if (error) return <div className="admin-error">Failed to load: {error} <button className="admin-btn" onClick={refresh}>Retry</button></div>
  if (!stats) return null

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="admin-subtitle">Live record counts, scale targets, and ingestion pipeline across all 6 verticals.</p>
        </div>
        <button className="admin-btn admin-btn-ghost" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh stats'}
        </button>
      </div>

      {/* Global summary cards */}
      <div className="admin-stat-cards">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Entries</span>
          <span className="admin-stat-value">{formatNumber(stats.total_entries)}</span>
          <span className="admin-stat-sub">across all verticals</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Cross-links</span>
          <span className="admin-stat-value">{formatNumber(stats.total_relations)}</span>
          <span className="admin-stat-sub">relation mappings</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Ingestion Jobs</span>
          <span className="admin-stat-value">{formatNumber(stats.total_ingestion)}</span>
          <span className="admin-stat-sub">{stats.ingestion_summary.done} done / {stats.ingestion_summary.pending} pending</span>
        </div>
        <div className="admin-stat-card admin-stat-card-accent">
          <span className="admin-stat-label">1B+ Scale Readiness</span>
          <span className="admin-stat-value">16-partition</span>
          <span className="admin-stat-sub">hash-sharded tables ready</span>
        </div>
      </div>

      {/* Scale readiness banner */}
      <div className="admin-readiness-banner">
        <div className="admin-readiness-text">
          <h3>1B+ Scale Architecture</h3>
          <p>
            All core tables use 16-way hash partitioning with BIGINT identity IDs, composite indexes,
            and DB-level keyset pagination. The schema is designed for 1B+ records without re-architecting.
          </p>
        </div>
        <div className="admin-readiness-badge">
          <span className="readiness-pill readiness-production">Architecture Ready</span>
        </div>
      </div>

      {/* Per-vertical table */}
      <div className="admin-section">
        <div className="admin-section-head">
          <h2>Vertical Performance</h2>
          <Link to="/admin/entries" className="admin-btn admin-btn-sm">Manage entries &rarr;</Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vertical</th>
                <th className="ta-right">Live Count</th>
                <th className="ta-right">Target</th>
                <th>Progress</th>
                <th>Categories</th>
                <th>Ingestion</th>
                <th>Readiness</th>
              </tr>
            </thead>
            <tbody>
              {stats.verticals.map((v: VerticalStat) => {
                const target = parseTargetVolume(v.target_volume)
                const readiness = getScaleReadiness(v.entry_count, target)
                const pctBar = Math.min(readiness.pct, 100)
                return (
                  <tr key={v.vertical_id}>
                    <td>
                      <Link to={`/admin/entries?vertical=${v.vertical_id}`} className="admin-vertical-link">
                        <span className={`admin-vertical-dot dot-${v.slug}`} />
                        {v.name}
                      </Link>
                    </td>
                    <td className="ta-right admin-num">{formatNumber(v.entry_count)}</td>
                    <td className="ta-right admin-num admin-muted">{v.target_volume}</td>
                    <td>
                      <div className="admin-progress">
                        <div className="admin-progress-bar">
                          <div
                            className={`admin-progress-fill fill-${readiness.level}`}
                            style={{ width: `${Math.max(pctBar, 0.5)}%` }}
                          />
                        </div>
                        <span className="admin-progress-pct">{readiness.pct.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="ta-center">{v.category_count}</td>
                    <td className="ta-center">
                      <span className="admin-ingestion-pill">
                        {v.ingestion_count} total
                      </span>
                      {v.ingestion_failed > 0 && (
                        <span className="admin-ingestion-failed">{v.ingestion_failed} failed</span>
                      )}
                    </td>
                    <td>
                      <span className={`readiness-pill readiness-${readiness.level}`}>
                        {readiness.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traffic & page views analytics */}
      <div className="admin-section">
        <div className="admin-section-head">
          <h2>Traffic &amp; Page Views</h2>
          <span className="admin-subtitle">Aggregated daily page views across the public site.</span>
        </div>

        <div className="admin-stat-cards">
          <div className="admin-stat-card">
            <span className="admin-stat-label">Today</span>
            <span className="admin-stat-value">{formatNumber(traffic?.today ?? 0)}</span>
            <span className="admin-stat-sub">views since midnight</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Last 7 Days</span>
            <span className="admin-stat-value">{formatNumber(traffic?.last7days ?? 0)}</span>
            <span className="admin-stat-sub">rolling week</span>
          </div>
          <div className="admin-stat-card admin-stat-card-accent">
            <span className="admin-stat-label">All Time</span>
            <span className="admin-stat-value">{formatNumber(traffic?.alltime ?? 0)}</span>
            <span className="admin-stat-sub">since tracking began</span>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vertical</th>
                <th className="ta-right">Page Views</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {verticalTraffic.map((v) => {
                const total = verticalTraffic.reduce((sum, row) => sum + Number(row.views), 0)
                const pct = total > 0 ? (Number(v.views) / total) * 100 : 0
                return (
                  <tr key={v.vertical_id}>
                    <td>
                      <Link to={`/${v.slug}`} className="admin-vertical-link">
                        <span className={`admin-vertical-dot dot-${v.slug}`} />
                        {v.name}
                      </Link>
                    </td>
                    <td className="ta-right admin-num">{formatNumber(Number(v.views))}</td>
                    <td>
                      <div className="admin-progress">
                        <div className="admin-progress-bar">
                          <div className="admin-progress-fill fill-production" style={{ width: `${Math.max(pct, 0.5)}%` }} />
                        </div>
                        <span className="admin-progress-pct">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="admin-table-wrap" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Top 10 Most Visited Pages</th>
                <th className="ta-right">Views</th>
              </tr>
            </thead>
            <tbody>
              {topPages.length === 0 && (
                <tr><td className="admin-muted">No page views recorded yet.</td><td className="ta-right admin-num">0</td></tr>
              )}
              {topPages.map((p) => (
                <tr key={p.path}>
                  <td>
                    <span className="admin-top-page-path">
                      {p.entry_title ?? p.path}
                      {p.entry_title && <span className="admin-top-page-sub">{p.path}</span>}
                    </span>
                  </td>
                  <td className="ta-right admin-num">{formatNumber(Number(p.views))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ingestion pipeline summary */}
      <div className="admin-section">
        <div className="admin-section-head">
          <h2>Ingestion Pipeline</h2>
          <Link to="/admin/batch" className="admin-btn admin-btn-sm">Batch generator &rarr;</Link>
        </div>
        <div className="admin-ingestion-grid">
          <div className="admin-ingestion-card">
            <span className="admin-ingestion-status status-pending">Pending</span>
            <span className="admin-ingestion-num">{stats.ingestion_summary.pending}</span>
          </div>
          <div className="admin-ingestion-card">
            <span className="admin-ingestion-status status-processing">Processing</span>
            <span className="admin-ingestion-num">{stats.ingestion_summary.processing}</span>
          </div>
          <div className="admin-ingestion-card">
            <span className="admin-ingestion-status status-done">Done</span>
            <span className="admin-ingestion-num">{stats.ingestion_summary.done}</span>
          </div>
          <div className="admin-ingestion-card">
            <span className="admin-ingestion-status status-failed">Failed</span>
            <span className="admin-ingestion-num">{stats.ingestion_summary.failed}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
