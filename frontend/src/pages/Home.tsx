import { useState, useRef, useEffect } from 'react'
import { Header } from '../components/Header'
import { FilterBar } from '../components/FilterBar'
import { VenueCard } from '../components/VenueCard'
import { VenueMap } from '../components/VenueMap'
import { venues } from '../data/venues'
import { useFilteredVenues } from '../hooks/useFilteredVenues'

export function Home() {
  const { filteredVenues, filters, setFilters } = useFilteredVenues(venues)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll selected card into view when selection changes from map
  useEffect(() => {
    if (!selectedVenueId || !listRef.current) return
    const el = document.getElementById(`venue-card-${selectedVenueId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedVenueId])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <FilterBar filters={filters} onFiltersChange={setFilters} />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Left: venue list */}
        <div className="lg:w-[420px] lg:flex-shrink-0 lg:max-h-[calc(100vh-12rem)] flex flex-col">
          <p className="text-gray-600 mb-4">
            Showing {filteredVenues.length} {filteredVenues.length === 1 ? 'venue' : 'venues'}
          </p>
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2"
          >
            {filteredVenues.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No venues match your filters.</p>
                <p className="text-sm text-gray-400 mt-2">Try adjusting your search.</p>
              </div>
            ) : (
              filteredVenues.map((venue) => (
                <div key={venue.id} id={`venue-card-${venue.id}`}>
                  <VenueCard
                    venue={venue}
                    selected={selectedVenueId === venue.id}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: map */}
        <div className="flex-1 min-h-[320px] lg:min-h-[540px]">
          <VenueMap
            venues={filteredVenues}
            selectedVenueId={selectedVenueId}
            onSelectVenue={setSelectedVenueId}
          />
        </div>
      </div>
    </div>
  )
}
