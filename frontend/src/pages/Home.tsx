import { useState, useRef, useEffect, useMemo } from 'react'
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

export function Home() {
  const navigate = useNavigate()
  const { venues: apiVenues, loading: venuesLoading, error: venuesError } = useCourtsAsVenues()
  const { filteredVenues, filters, setFilters } = useFilteredVenues(apiVenues)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [quickBookVenue, setQuickBookVenue] = useState<Venue | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedVenueId || !listRef.current) return
    const el = document.getElementById(`venue-card-${selectedVenueId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedVenueId])

  // Extract unique suburbs from ALL venues (not just filtered) for autocomplete
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
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
              {venuesLoading ? (
                <div className="text-center py-12 text-bark-lt text-sm">Loading venues…</div>
              ) : venuesError ? (
                <div className="text-center py-12 text-bark-lt text-sm">
                  <p>Could not load venues.</p>
                  <p className="mt-2">{venuesError}</p>
                </div>
              ) : filteredVenues.length === 0 ? (
                <div className="text-center py-12 text-bark-lt text-sm">
                  <p>No venues match your filters.</p>
                  <p className="mt-2">Try adjusting your search.</p>
                </div>
              ) : (
                filteredVenues.map((venue) => (
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
            <div className="absolute top-3 right-3 z-[850]">
              <a
                href="/map"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 border border-[var(--border)] text-[11px] font-medium text-g600 shadow-sm hover:bg-white hover:border-g200 transition-colors"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-g600" />
                <span>View full map</span>
              </a>
            </div>
            <VenueMap
              venues={filteredVenues}
              selectedVenueId={selectedVenueId}
              onSelectVenue={setSelectedVenueId}
              onViewDetail={(id) => navigate(`/venue/${id}`)}
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