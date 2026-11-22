import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats, getScaleReadiness, parseTargetVolume, formatNumber } from '../../lib/admin'
import type { AdminStats, VerticalStat } from '../../lib/admin'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAdminStats()
      .then((s) => !cancelled && setStats(s))
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  function refresh() {
    setLoading(true)
    setError(null)
    getAdminStats()
      .then(setStats)
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
