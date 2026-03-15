import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { Hero } from '../components/Hero'
import { FilterChips } from '../components/FilterChips'
import { StatsRow } from '../components/StatsRow'
import { VenueCard } from '../components/VenueCard'
import { VenueMap } from '../components/VenueMap'
import { QuickBookModal } from '../components/QuickBookModal'
import { useCourtsAsVenues } from '../hooks/useCourtsAsVenues'
import { useFilteredVenues } from '../hooks/useFilteredVenues'
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

export function Home() {
  const navigate = useNavigate()
  const { venues: apiVenues, loading: venuesLoading, error: venuesError } = useCourtsAsVenues()
  const { filteredVenues, filters, setFilters } = useFilteredVenues(apiVenues)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [quickBookVenue, setQuickBookVenue] = useState<Venue | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Location only (list sorted by distance when available)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'success' | 'denied'>('idle')

  useEffect(() => {
    if (!selectedVenueId || !listRef.current) return
    const el = document.getElementById(`venue-card-${selectedVenueId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedVenueId])

  const allSuburbs = useMemo(
    () => [...new Set(apiVenues.map((v) => v.suburb))].sort(),
    [apiVenues]
  )

  const suburbSet = new Set(filteredVenues.map((v) => v.suburb))
  const courtCount = filteredVenues.reduce((acc, v) => acc + (v.courts ?? 0), 0)

  const handleFiltersChange = (next: FilterState) => {
    setFilters(next)
    setSelectedVenueId(null)
  }

  const requestLocation = useCallback(() => {
    if (userLat !== null) return
    setLocStatus('loading')
    if (!navigator.geolocation) {
      setLocStatus('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setLocStatus('success')
      },
      () => setLocStatus('denied'),
      { timeout: 8000 }
    )
  }, [userLat])

  // Request location on mount so list is "near you" by default
  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const sortedVenues = useMemo(() => {
    const list = [...filteredVenues]
    if (userLat !== null && userLng !== null) {
      return list.sort(
        (a, b) => haversine(userLat, userLng, a.lat, a.lng) - haversine(userLat, userLng, b.lat, b.lng)
      )
    }
    return list
  }, [filteredVenues, userLat, userLng])

  // When list changes, focus selection (and map) on the first item
  const firstVenueId = sortedVenues[0]?.id ?? null
  useEffect(() => {
    setSelectedVenueId(firstVenueId)
  }, [firstVenueId])

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Hero
          searchQuery={filters.location}
          onSearchChange={(q) => setFilters({ ...filters, location: q })}
          onSearchSubmit={() => {}}
          suburbs={allSuburbs}
        />
        <FilterChips filters={filters} onFiltersChange={handleFiltersChange} />
        <StatsRow venueCount={filteredVenues.length} suburbCount={suburbSet.size} courtCount={courtCount} />

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 pt-4 pb-8 gap-6">
          <div className="lg:w-[380px] xl:w-[420px] lg:flex-shrink-0 flex flex-col lg:bg-white lg:rounded-2xl lg:border lg:border-[var(--border)] lg:p-5 lg:shadow-sm lg:max-h-[calc(100vh-16rem)] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-lora text-lg font-semibold text-bark">Venues near you</h2>
              {locStatus === 'loading' && (
                <span className="text-[10px] text-bark-lt animate-pulse">📍 Getting location…</span>
              )}
              {locStatus === 'denied' && (
                <span className="text-[10px] text-amber-600">📍 Location denied</span>
              )}
              {locStatus === 'success' && (
                <span className="text-[10px] text-green">📍 Sorted by distance</span>
              )}
              {locStatus === 'idle' && (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="text-[10px] font-medium text-g600 hover:underline"
                >
                  📍 Use my location
                </button>
              )}
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
              {venuesLoading ? (
                <div className="text-center py-12 text-bark-lt text-sm">Loading venues…</div>
              ) : venuesError ? (
                <div className="text-center py-12 text-bark-lt text-sm">
                  <p>Could not load venues.</p>
                  <p className="mt-2">{venuesError}</p>
                </div>
              ) : sortedVenues.length === 0 ? (
                <div className="text-center py-12 text-bark-lt text-sm">
                  <p>No venues match your filters.</p>
                  <p className="mt-2">Try adjusting your search.</p>
                </div>
              ) : (
                sortedVenues.map((venue) => (
                  <div key={venue.id} id={`venue-card-${venue.id}`}>
                    <VenueCard
                      venue={venue}
                      selected={selectedVenueId === venue.id}
                      onSelect={setSelectedVenueId}
                      onQuickBook={setQuickBookVenue}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="relative flex-1 min-h-[320px] lg:min-h-[480px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--cream)] shadow-sm">
            <div className="absolute top-3 right-3 z-[500]">
              <a
                href="/map"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 border border-[var(--border)] text-[11px] font-medium text-g600 shadow-sm hover:bg-white hover:border-g200 transition-colors"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-g600" />
                <span>View full map</span>
              </a>
            </div>
            <VenueMap
              venues={sortedVenues}
              selectedVenueId={selectedVenueId}
              onSelectVenue={setSelectedVenueId}
              onViewDetail={(id) => navigate(`/venue/${id}`)}
              userPosition={userLat !== null && userLng !== null ? { lat: userLat, lng: userLng } : null}
            />
          </div>
        </div>
      </div>

      {quickBookVenue && (
        <QuickBookModal venue={quickBookVenue} onClose={() => setQuickBookVenue(null)} />
      )}
    </div>
  )
}
