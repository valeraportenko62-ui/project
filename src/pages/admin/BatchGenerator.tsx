import { useEffect, useState } from 'react'
import {
  batchInsertEntries,
  listIngestionJobsAdmin,
  updateIngestionJob,
  formatNumber,
} from '../../lib/admin'
import { enqueueIngestion } from '../../lib/data'
import { useVerticals } from '../../hooks/useVerticals'
import type { IngestionJob, IngestionStatus } from '../../lib/types'

const BATCH_CAP = 5000

export default function BatchGenerator() {
  const { verticals } = useVerticals()
  const [selectedVertical, setSelectedVertical] = useState<number | null>(null)
  const [batchSize, setBatchSize] = useState(100)
  const [batchStatus, setBatchStatus] = useState<'draft' | 'published'>('draft')
  const [batchPrefix, setBatchPrefix] = useState('sim')

  // Simulation state
  const [simulating, setSimulating] = useState(false)
  const [simLog, setSimLog] = useState<string[]>([])
  const [simTotalInserted, setSimTotalInserted] = useState(0)

  // Job creation
  const [jobSourceType, setJobSourceType] = useState('csv_import')
  const [jobPayload, setJobPayload] = useState('{"source": "simulator", "batch_size": 1000}')

  // Jobs list
  const [jobs, setJobs] = useState<IngestionJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (verticals.length > 0 && selectedVertical === null) {
      setSelectedVertical(verticals[0].id)
    }
  }, [verticals, selectedVertical])

  async function loadJobs() {
    setJobsLoading(true)
    try {
      const { items } = await listIngestionJobsAdmin({ limit: 25 })
      setJobs(items)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setJobsLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  function log(msg: string) {
    setSimLog((prev) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 50))
  }

  async function runBatchInsert() {
    if (!selectedVertical) return
    setSimulating(true)
    setError(null)
    const vname = verticals.find((v) => v.id === selectedVertical)?.name ?? `#${selectedVertical}`
    const rounds = Math.ceil(batchSize / BATCH_CAP)
    let totalInserted = 0

    log(`Starting batch simulation: ${batchSize} entries into ${vname}`)

    for (let round = 1; round <= rounds; round++) {
      const chunk = Math.min(batchSize - totalInserted, BATCH_CAP)
      if (chunk <= 0) break
      try {
        const result = await batchInsertEntries({
          verticalId: selectedVertical,
          count: chunk,
          status: batchStatus,
          prefix: batchPrefix,
        })
        totalInserted += result.inserted
        setSimTotalInserted(totalInserted)
        log(`Round ${round}/${rounds}: inserted ${result.inserted} entries (total: ${totalInserted})`)
      } catch (err) {
        log(`Round ${round} failed: ${(err as Error).message}`)
        setError((err as Error).message)
        break
      }
    }

    log(`Batch simulation complete: ${totalInserted} entries inserted into ${vname}`)
    setSimulating(false)
    loadJobs()
  }

  async function enqueueJob() {
    if (!selectedVertical) return
    setError(null)
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(jobPayload)
    } catch {
      setError('Invalid JSON payload.')
      return
    }
    try {
      await enqueueIngestion({
        vertical_id: selectedVertical,
        source_type: jobSourceType,
        payload,
      })
      log(`Enqueued ${jobSourceType} job for ${verticals.find((v) => v.id === selectedVertical)?.name}`)
      loadJobs()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function advanceJob(job: IngestionJob) {
    const flow: Record<IngestionStatus, IngestionStatus> = {
      pending: 'processing',
      processing: 'done',
      done: 'done',
      failed: 'pending',
    }
    const next = flow[job.status]
    try {
      await updateIngestionJob(job.id, {
        status: next,
        processed_at: next === 'done' ? new Date().toISOString() : null,
        attempts: next === 'processing' ? job.attempts + 1 : job.attempts,
      })
      loadJobs()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function failJob(job: IngestionJob) {
    try {
      await updateIngestionJob(job.id, {
        status: 'failed',
        last_error: 'Simulated failure during batch generator test',
        attempts: job.attempts + 1,
      })
      loadJobs()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Batch Record Generator</h1>
          <p className="admin-subtitle">
            Simulate high-volume data ingestion. Generate placeholder entries in bulk and track ingestion queue jobs.
          </p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-batch-grid">
        {/* Batch insert simulator */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Bulk Entry Generator</h2>
          </div>
          <p className="admin-panel-desc">
            Inserts placeholder entries directly into the database in chunks of {formatNumber(BATCH_CAP)}.
            Useful for testing listing performance, pagination, and partition distribution.
          </p>

          <label className="admin-field">
            <span>Target vertical</span>
            <select
              className="admin-select"
              value={selectedVertical ?? ''}
              onChange={(e) => setSelectedVertical(Number(e.target.value))}
            >
              {verticals.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.target_volume})</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>Number of entries: {formatNumber(batchSize)}</span>
            <input
              type="range"
              min={10}
              max={20000}
              step={10}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="admin-range"
            />
            <small className="admin-field-hint">
              Will be inserted in {Math.ceil(batchSize / BATCH_CAP)} round(s) of up to {formatNumber(BATCH_CAP)} each.
            </small>
          </label>

          <div className="admin-field-row">
            <label className="admin-field">
              <span>Entry status</span>
              <select
                className="admin-select"
                value={batchStatus}
                onChange={(e) => setBatchStatus(e.target.value as 'draft' | 'published')}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>

            <label className="admin-field">
              <span>Slug prefix</span>
              <input
                className="admin-input"
                type="text"
                value={batchPrefix}
                onChange={(e) => setBatchPrefix(e.target.value)}
              />
            </label>
          </div>

          <button
            className="admin-btn admin-btn-primary admin-btn-lg"
            onClick={runBatchInsert}
            disabled={simulating || !selectedVertical}
          >
            {simulating ? `Generating… (${formatNumber(simTotalInserted)} inserted)` : `Generate ${formatNumber(batchSize)} entries`}
          </button>

          {simTotalInserted > 0 && !simulating && (
            <div className="admin-batch-result">
              Last run: {formatNumber(simTotalInserted)} entries inserted successfully.
            </div>
          )}
        </div>

        {/* Ingestion queue simulator */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Enqueue Ingestion Job</h2>
          </div>
          <p className="admin-panel-desc">
            Add a job to the ingestion queue to simulate an external data source pipeline.
          </p>

          <label className="admin-field">
            <span>Source type</span>
            <select
              className="admin-select"
              value={jobSourceType}
              onChange={(e) => setJobSourceType(e.target.value)}
            >
              <option value="csv_import">CSV Import</option>
              <option value="api_fetch">API Fetch</option>
              <option value="web_scrape">Web Scrape</option>
              <option value="json_bulk">JSON Bulk</option>
              <option value="rss_feed">RSS Feed</option>
            </select>
          </label>

          <label className="admin-field">
            <span>Payload (JSON)</span>
            <textarea
              className="admin-textarea"
              value={jobPayload}
              onChange={(e) => setJobPayload(e.target.value)}
              rows={4}
            />
            <small className="admin-field-hint">JSON metadata stored with the job for processing.</small>
          </label>

          <button
            className="admin-btn admin-btn-primary"
            onClick={enqueueJob}
            disabled={!selectedVertical}
          >
            Enqueue job
          </button>
        </div>
      </div>

      {/* Simulation log */}
      {simLog.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-head">
            <h2>Simulation Log</h2>
            <button className="admin-btn admin-btn-sm" onClick={() => setSimLog([])}>Clear</button>
          </div>
          <div className="admin-log">
            {simLog.map((line, i) => (
              <div key={i} className="admin-log-line">{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Ingestion queue table */}
      <div className="admin-section">
        <div className="admin-section-head">
          <h2>Ingestion Queue</h2>
          <button className="admin-btn admin-btn-sm" onClick={loadJobs} disabled={jobsLoading}>
            {jobsLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vertical</th>
                <th>Source</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan={7} className="admin-empty">No jobs in queue.</td></tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id}>
                    <td className="admin-num admin-muted">{j.id}</td>
                    <td>{verticals.find((v) => v.id === j.vertical_id)?.name ?? `#${j.vertical_id}`}</td>
                    <td className="admin-slug">{j.source_type}</td>
                    <td><span className={`status-tag status-tag-${j.status}`}>{j.status}</span></td>
                    <td className="ta-center admin-num">{j.attempts}</td>
                    <td className="admin-muted admin-date">{new Date(j.created_at).toLocaleString()}</td>
                    <td>
                      {j.status !== 'done' && j.status !== 'failed' && (
                        <button className="admin-btn admin-btn-sm" onClick={() => advanceJob(j)}>
                          Advance &rarr;
                        </button>
                      )}
                      {j.status === 'failed' && (
                        <button className="admin-btn admin-btn-sm" onClick={() => advanceJob(j)}>
                          Retry
                        </button>
                      )}
                      {j.status !== 'failed' && j.status !== 'done' && (
                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => failJob(j)}>
                          Fail
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
