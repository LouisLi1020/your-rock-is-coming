import { useState, useEffect } from 'react'
import { getCourts } from '../api/courts'
import { courtToVenue } from '../utils/courtToVenue'
import { MOCK_SYDNEY_VENUES } from '../data/mockSydneyCourts'
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
        const list = res?.courts?.length ? res.courts.map(courtToVenue) : MOCK_SYDNEY_VENUES
        setVenues(list)
        if (!res?.courts?.length) setError(null) // 使用 mock 时不显示错误
      })
      .catch(() => {
        if (cancelled) return
        setVenues(MOCK_SYDNEY_VENUES)
        setError(null) // API 不可用时静默回退到 mock，不提示错误
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return { venues, loading, error }
}
