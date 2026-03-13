import { useMemo, useState } from 'react'
import type { Venue } from '../data/venues'
import type { FilterState } from '../components/FilterBar'

const defaultFilters: FilterState = {
  surface: 'all',
  location: '',
  indoorOutdoor: 'all',
}

export function useFilteredVenues(venueList: Venue[]) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const filteredVenues = useMemo(() => {
    return venueList.filter((v) => {
      if (filters.location) {
        const q = filters.location.toLowerCase()
        if (
          !v.suburb.toLowerCase().includes(q) &&
          !v.name.toLowerCase().includes(q) &&
          !v.address.toLowerCase().includes(q)
        )
          return false
      }
      if (filters.surface !== 'all') {
        const match = v.surfaceTypes.some((s) =>
          s.toLowerCase().includes(filters.surface.toLowerCase())
        )
        if (!match) return false
      }
      if (filters.indoorOutdoor === 'indoor' && !v.indoor) return false
      if (filters.indoorOutdoor === 'outdoor' && !v.outdoor) return false
      return true
    })
  }, [venueList, filters])

  return { filteredVenues, filters, setFilters }
}
