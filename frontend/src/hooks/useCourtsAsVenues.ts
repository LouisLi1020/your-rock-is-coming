import { useState, useEffect } from 'react'
import { getCourts } from '../api/courts'
import { courtToVenue } from '../utils/courtToVenue'
import type { Venue } from '../data/venues'

export function useCourtsAsVenues(): {
  venues: Venue[]
  loading: boolean
  error: string | null
} {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getCourts()
      .then((res) => {
        if (cancelled) return
        setVenues(res.courts.map(courtToVenue))
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message ?? 'Failed to load courts')
        setVenues([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return { venues, loading, error }
}
