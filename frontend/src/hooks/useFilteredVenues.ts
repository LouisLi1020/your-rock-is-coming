import { useMemo, useState } from 'react'
import type { Venue } from '../data/venues'
import type { FilterState } from '../components/FilterBar'

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const defaultFilters: FilterState = {
  location: '',
  indoor: false,
  outdoor: false,
  hard: false,
  clay: false,
  synthetic_clay: false,
  grass: false,
  synthetic_grass: false,
  parking: false,
  lights: false,
  toilet: false,
  fourCourts: false,
}

const SURFACE_KEYS = ['hard', 'clay', 'synthetic_clay', 'grass', 'synthetic_grass'] as const

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
      if (filters.indoor && !filters.outdoor && !v.indoor) return false
      if (filters.outdoor && !filters.indoor && !v.outdoor) return false
      const selectedSurfaces = SURFACE_KEYS.filter((k) => filters[k])
      if (selectedSurfaces.length > 0 && v.surface_api != null && !selectedSurfaces.includes(v.surface_api)) return false
      if (filters.lights && !v.nightLighting) return false
      if (filters.parking && !v.amenities?.includes('Parking')) return false
      if (filters.toilet && !v.amenities?.includes('Toilet')) return false
      if (filters.fourCourts && (v.courts ?? 0) < 4) return false
      return true
    })
  }, [venueList, filters])

  return { filteredVenues, filters, setFilters }
}
