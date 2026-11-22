import { useEffect, useState } from 'react'
import { listVerticals } from '../lib/data'
import type { Vertical } from '../lib/types'

let cache: Vertical[] | null = null

export function useVerticals() {
  const [verticals, setVerticals] = useState<Vertical[]>(cache ?? [])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return
    listVerticals()
      .then((rows) => {
        cache = rows
        setVerticals(rows)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  return { verticals, error }
}
