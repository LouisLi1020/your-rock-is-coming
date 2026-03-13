import { useState } from 'react'
import { Nav } from '../components/Nav'
import { VenueMap } from '../components/VenueMap'
import { VenueCard } from '../components/VenueCard'
import { QuickBookModal } from '../components/QuickBookModal'
import { venues } from '../data/venues'
import { useFilteredVenues } from '../hooks/useFilteredVenues'
import { FilterChips } from '../components/FilterChips'
import type { Venue } from '../data/venues'

export function MapPage() {
  const { filteredVenues, filters, setFilters } = useFilteredVenues(venues)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [quickBookVenue, setQuickBookVenue] = useState<Venue | null>(null)

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="lg:w-80 flex-shrink-0 border-r border-[var(--border)] bg-white p-4 flex flex-col">
          <FilterChips filters={filters} onFiltersChange={setFilters} />
          <p className="text-xs text-bark-lt mt-2 mb-2">{filteredVenues.length} venues</p>
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredVenues.map((v) => (
              <VenueCard
                key={v.id}
                venue={v}
                selected={selectedVenueId === v.id}
                onQuickBook={setQuickBookVenue}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-[320px] lg:min-h-[calc(100vh-3.5rem)]">
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