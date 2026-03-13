import { useState, useRef, useEffect } from 'react'
import { Nav } from '../components/Nav'
import { Hero } from '../components/Hero'
import { FilterChips } from '../components/FilterChips'
import { StatsRow } from '../components/StatsRow'
import { VenueCard } from '../components/VenueCard'
import { VenueMap } from '../components/VenueMap'
import { QuickBookModal } from '../components/QuickBookModal'
import { venues } from '../data/venues'
import { useFilteredVenues } from '../hooks/useFilteredVenues'
import type { Venue } from '../data/venues'

export function Home() {
  const { filteredVenues, filters, setFilters } = useFilteredVenues(venues)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [quickBookVenue, setQuickBookVenue] = useState<Venue | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedVenueId || !listRef.current) return
    const el = document.getElementById(`venue-card-${selectedVenueId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedVenueId])

  const suburbSet = new Set(filteredVenues.map((v) => v.suburb))
  const courtCount = filteredVenues.reduce((acc, v) => acc + (v.courts ?? 0), 0)

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <Hero
        searchQuery={filters.location}
        onSearchChange={(q) => setFilters({ ...filters, location: q })}
        onSearchSubmit={() => {}}
      />
      <FilterChips filters={filters} onFiltersChange={setFilters} />
      <StatsRow venueCount={filteredVenues.length} suburbCount={suburbSet.size} courtCount={courtCount} />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <div className="lg:w-[420px] lg:flex-shrink-0 lg:max-h-[calc(100vh-20rem)] flex flex-col">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-lora text-lg font-semibold text-bark">Venues near you</h2>
            <a href="/map" className="text-xs font-medium text-g600 hover:underline">View on map →</a>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
            {filteredVenues.length === 0 ? (
              <div className="text-center py-12 text-bark-lt">
                <p>No venues match your filters.</p>
                <p className="text-sm mt-2">Try adjusting your search.</p>
              </div>
            ) : (
              filteredVenues.map((venue) => (
                <div key={venue.id} id={`venue-card-${venue.id}`}>
                  <VenueCard
                    venue={venue}
                    selected={selectedVenueId === venue.id}
                    onQuickBook={setQuickBookVenue}
                  />
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex-1 min-h-[320px] lg:min-h-[540px]">
          <VenueMap
            venues={filteredVenues}
            selectedVenueId={selectedVenueId}
            onSelectVenue={setSelectedVenueId}
          />
        </div>
      </div>

      {quickBookVenue && (
        <QuickBookModal venue={quickBookVenue} onClose={() => setQuickBookVenue(null)} />
      )}
    </div>
  )
}