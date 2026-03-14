
import { useState, useEffect, useCallback, useRef } from 'react'
import { Nav } from '../components/Nav'
import { LeftPanel, CourtCard, CourtMap } from '../components/home'
import { useBooking } from '../context/BookingContext'
import { getCourts } from '../api/courts'
import { getBulkWeather } from '../api/weather'
import type { Court } from '../api/courts'
import type { WeatherData } from '../api/weather'

export function MapPage() {
  const { setBookingsPanelOpen } = useBooking()
  const [courts, setCourts] = useState<Court[]>([])
  const [weatherMap, setWeatherMap] = useState<Record<number, WeatherData>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState('name')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // ═══ Load data from API ═══
  useEffect(() => {
    getCourts().then((res) => {
      if (res.success) setCourts(res.courts)
    }).catch(console.error)

    const today = new Date().toISOString().split('T')[0]
    getBulkWeather(today).then((res) => {
      if (res.success) setWeatherMap(res.weather)
    }).catch(console.error)
  }, [])

  // ═══ Filter + Sort ═══
  const filtered = courts.filter((c) => {
    const q = searchQuery.toLowerCase()
    if (q && !c.name.toLowerCase().includes(q) && !c.suburb.toLowerCase().includes(q) && !c.address.toLowerCase().includes(q)) return false
    if (filters.has('lights') && !c.lights) return false
    if (filters.has('parking') && !c.parking) return false
    if (filters.has('hard') && c.surface !== 'hard') return false
    if (filters.has('synthetic') && c.surface !== 'synthetic_grass') return false
    if (filters.has('4courts') && c.courts_count < 4) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'courts') return b.courts_count - a.courts_count
    if (sortBy === 'suburb') return a.suburb.localeCompare(b.suburb) || a.name.localeCompare(b.name)
    return 0
  })

  // ═══ Interactions ═══
  const toggleFilter = useCallback((f: string) => {
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(f)) {
        next.delete(f)
      } else {
        if (f === 'hard') next.delete('synthetic')
        if (f === 'synthetic') next.delete('hard')
        next.add(f)
      }
      return next
    })
  }, [])

  const clearFilters = useCallback(() => setFilters(new Set()), [])

  const selectCourt = useCallback((id: number) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

  // Scroll card into view
  useEffect(() => {
    if (!selectedId || !listRef.current) return
    const el = listRef.current.querySelector(`[data-id="${selectedId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedId])

  // Booking — for now navigate or open modal (placeholder)
  const handleBook = useCallback((courtId: number) => {
    // Navigate to the book page with venue pre-selected
    window.location.href = `/book?court=${courtId}`
  }, [])

  // Recommended court = St Ives Village Green = id 9
  const handleBookRecommended = useCallback(() => handleBook(9), [handleBook])

  // First court's weather for the sidebar
  const sidebarWeather = Object.values(weatherMap)[0] ?? null

  return (
    <div className="h-screen flex flex-col bg-cream overflow-hidden">
      <Nav />
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <LeftPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
          weather={sidebarWeather}
          onOpenBookings={() => setBookingsPanelOpen(true)}
          onBookRecommended={handleBookRecommended}
        />

        {/* MIDDLE — Court List */}
        <div className="w-[360px] min-w-[360px] h-full flex flex-col bg-cream border-r border-[#E8E6E1]">
          <div className="px-[18px] py-4 bg-white border-b border-[#E8E6E1] flex items-center justify-between">
            <span className="text-sm font-semibold">All Courts</span>
            <span className="text-[13px] text-ink-muted">
              <b className="font-bold text-ink">{sorted.length}</b> results
            </span>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2 scrollbar-thin">
            {sorted.length === 0 ? (
              <div className="text-center py-12 text-ink-muted text-sm">No courts match your filters.</div>
            ) : (
              sorted.map((court) => (
                <CourtCard
                  key={court.id}
                  court={court}
                  selected={selectedId === court.id}
                  weather={weatherMap[court.id] ?? null}
                  onSelect={selectCourt}
                  onBook={handleBook}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Map */}
        <div className="flex-1 relative">
          <CourtMap
            courts={sorted}
            selectedId={selectedId}
            onSelectCourt={selectCourt}
            onBookCourt={handleBook}
          />
        </div>
      </div>
    </div>
  )
}
