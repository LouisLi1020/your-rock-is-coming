import { useMemo, useState } from 'react'
import type { Venue } from '../data/venues'
import type { FilterState } from '../components/FilterBar'

const defaultFilters: FilterState = {
  surface: 'all',
  location: '',
  lights: false,
  parking: false,
  minCourts: 0,
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
        if (filters.surface === 'hard' && v.surface_api !== 'hard') return false
        if (filters.surface === 'synthetic' && v.surface_api !== 'synthetic_grass') return false
      }
      if (filters.lights && !v.nightLighting) return false
      if (filters.parking && !v.amenities?.includes('Parking')) return false
      if (filters.minCourts >= 4 && (v.courts ?? 0) < 4) return false
      return true
    })
  }, [venueList, filters])

  return { filteredVenues, filters, setFilters }
}
