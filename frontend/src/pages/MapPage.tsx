import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { CourtMap } from '../components/home/CourtMap'
import { QuickBookModal } from '../components/QuickBookModal'
import { useBooking } from '../context/BookingContext'
import { getCourts } from '../api/courts'
import type { Court } from '../api/courts'
import type { Venue } from '../data/venues'
import { courtToVenue } from '../utils/courtToVenue'

/* ── Label helpers (consistent with FilterChips) ── */
const SURFACE_LABELS: Record<string, string> = {
  hard: 'Hard Court',
  clay: 'Clay',
  synthetic_clay: 'Synthetic Clay',
  grass: 'Grass',
  synthetic_grass: 'Synthetic Grass',
}

/* ── Filter groups (same as FilterChips on Discover) ── */
const FILTER_GROUPS = [
  {
    title: 'Environment',
    items: [
      { key: 'indoor', label: 'Indoor' },
      { key: 'outdoor', label: 'Outdoor' },
    ],
  },
  {
    title: 'Surface Type',
    items: [
      { key: 'hard', label: 'Hard Court' },
      { key: 'clay', label: 'Clay' },
      { key: 'synthetic_clay', label: 'Synthetic Clay' },
      { key: 'grass', label: 'Grass' },
      { key: 'synthetic_grass', label: 'Synthetic Grass' },
    ],
  },
  {
    title: 'Facilities',
    items: [
      { key: 'parking', label: 'Parking' },
      { key: 'lights', label: 'Night Lights' },
      { key: 'toilet', label: 'Toilet' },
      { key: '4courts', label: '4+ Courts' },
    ],
  },
]

/* ── Haversine distance (km) ── */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/* ── Simple suburb → coords lookup for manual input fallback ── */
const SUBURB_COORDS: Record<string, [number, number]> = {
  sydney: [-33.8688, 151.2093],
  chatswood: [-33.7969, 151.1832],
  gordon: [-33.7565, 151.1522],
  'st ives': [-33.7294, 151.1649],
  hornsby: [-33.7046, 151.0985],
  parramatta: [-33.8151, 151.0011],
  burwood: [-33.8774, 151.1044],
  beecroft: [-33.7507, 151.0658],
  epping: [-33.7726, 151.0816],
  bondi: [-33.8914, 151.2744],
  coogee: [-33.9226, 151.2561],
  manly: [-33.797, 151.2855],
  paddington: [-33.8843, 151.2266],
  'north sydney': [-33.8388, 151.2071],
  alexandria: [-33.9045, 151.1991],
}

export function MapPage() {
  const navigate = useNavigate()
  const { setBookingsPanelOpen } = useBooking()
  const [courts, setCourts] = useState<Court[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState('name')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [openFilterGroup, setOpenFilterGroup] = useState<string | null>(null)
  const [quickBookVenue, setQuickBookVenue] = useState<Venue | null>(null)

  // Location for distance sorting
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'denied'>('idle')
  const [manualSuburb, setManualSuburb] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  // ── Load courts ──
  useEffect(() => {
    getCourts()
      .then((res) => {
        if (res.success) setCourts(res.courts)
      })
      .catch(console.error)
  }, [])

  // ── Close filter dropdown on click outside ──
  useEffect(() => {
    if (!openFilterGroup) return
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenFilterGroup(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openFilterGroup])

  // ── Request geolocation when sorting by distance ──
  const requestLocation = useCallback(() => {
    if (userLat !== null) return // already have it
    setLocationStatus('loading')
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      setShowManualInput(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setLocationStatus('success')
        setShowManualInput(false)
      },
      () => {
        setLocationStatus('denied')
        setShowManualInput(true)
      },
      { timeout: 8000 }
    )
  }, [userLat])

  const handleSortChange = useCallback(
    (val: string) => {
      setSortBy(val)
      if (val === 'distance') requestLocation()
    },
    [requestLocation]
  )

  const applyManualSuburb = useCallback(() => {
    const key = manualSuburb.trim().toLowerCase()
    const coords = SUBURB_COORDS[key]
    if (coords) {
      setUserLat(coords[0])
      setUserLng(coords[1])
      setLocationStatus('success')
      setShowManualInput(false)
    }
  }, [manualSuburb])

  // ── Filter + Sort ──
  const filtered = courts.filter((c) => {
    const q = searchQuery.toLowerCase()
    if (q && !c.name.toLowerCase().includes(q) && !c.suburb.toLowerCase().includes(q) && !c.address.toLowerCase().includes(q))
      return false
    if (filters.has('indoor') && c.outdoor === 1) return false
    if (filters.has('outdoor') && c.outdoor === 0) return false
    if (filters.has('lights') && !c.lights) return false
    if (filters.has('parking') && !c.parking) return false
    if (filters.has('toilet') && !c.toilet) return false
    if (filters.has('hard') && c.surface !== 'hard') return false
    if (filters.has('clay') && c.surface !== 'clay') return false
    if (filters.has('synthetic_clay') && c.surface !== 'synthetic_clay') return false
    if (filters.has('grass') && c.surface !== 'grass') return false
    if (filters.has('synthetic_grass') && c.surface !== 'synthetic_grass') return false
    if (filters.has('4courts') && c.courts_count < 4) return false
    return true
  })

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sortBy === 'name') return list.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'courts') return list.sort((a, b) => b.courts_count - a.courts_count)
    if (sortBy === 'price') return list.sort((a, b) => a.price_per_hr - b.price_per_hr)
    if (sortBy === 'distance' && userLat !== null && userLng !== null) {
      return list.sort(
        (a, b) => haversine(userLat, userLng, a.lat, a.lng) - haversine(userLat, userLng, b.lat, b.lng)
      )
    }
    return list
  }, [filtered, sortBy, userLat, userLng])

  // When sort or list changes, focus selection (and map) on the first item — distance → nearest, price → cheapest, courts → most courts, name → first A–Z
  const firstId = sorted[0]?.id ?? null
  useEffect(() => {
    setSelectedId(firstId)
  }, [sortBy, firstId])

  // ── Suburb autocomplete for search ──
  const allSuburbs = useMemo(() => [...new Set(courts.map((c) => c.suburb))].sort(), [courts])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchSuggestions =
    searchQuery.trim().length > 0
      ? allSuburbs.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      : []

  // ── Interactions ──
  const toggleFilter = useCallback((f: string) => {
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
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

  const handleQuickBook = useCallback(
    (courtId: number) => {
      const court = courts.find((c) => c.id === courtId)
      if (court) setQuickBookVenue(courtToVenue(court))
    },
    [courts]
  )

  const handleViewDetail = useCallback(
    (courtId: number) => {
      navigate(`/venue/${courtId}`)
    },
    [navigate]
  )

  return (
    <div className="h-screen flex flex-col bg-cream overflow-hidden">
      <Nav />
      <div className="flex-1 flex overflow-hidden">
        {/* ══ LEFT PANEL: Search + Filters + Sort + Court List ══ */}
        <div className="w-[400px] min-w-[380px] h-full flex flex-col bg-white border-r border-[#E8E6E1]">
          {/* Search bar with autocomplete */}
          <div className="px-4 pt-4 pb-3 relative">
            <div className="flex items-center gap-2 bg-cream border-[1.5px] border-[#E8E6E1] rounded-[14px] px-3.5 py-2.5 transition-all focus-within:border-green focus-within:ring-[3px] focus-within:ring-green/10 focus-within:bg-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted flex-shrink-0">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchDropdown(true)
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchDropdown(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowSearchDropdown(false)
                }}
                placeholder="Search suburb, venue…"
                className="flex-1 bg-transparent border-none text-[13px] text-ink outline-none placeholder:text-ink-faint"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setShowSearchDropdown(false)
                  }}
                  className="text-ink-muted hover:text-ink text-sm"
                >
                  ✕
                </button>
              )}
            </div>
            {showSearchDropdown && searchSuggestions.length > 0 && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-[var(--border)] rounded-xl shadow-lg z-[3000] max-h-[200px] overflow-y-auto py-1">
                {searchSuggestions.map((suburb) => {
                  const idx = suburb.toLowerCase().indexOf(searchQuery.toLowerCase())
                  const before = suburb.slice(0, idx)
                  const match = suburb.slice(idx, idx + searchQuery.length)
                  const after = suburb.slice(idx + searchQuery.length)
                  return (
                    <button
                      key={suburb}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearchQuery(suburb)
                        setShowSearchDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-cream transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        {before}
                        <strong className="font-semibold text-green">{match}</strong>
                        {after}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filter chips (dropdown style, like Discover) */}
          <div ref={filterRef} className="relative z-20 flex border-y border-[var(--border)] bg-cream">
            {FILTER_GROUPS.map((group, index) => {
              const isOpen = openFilterGroup === group.title
              const count = group.items.filter((k) => filters.has(k.key)).length
              const isMiddle = index === 1
              return (
                <div
                  key={group.title}
                  className={`flex-1 min-w-0 relative flex flex-col items-center justify-center text-center py-3 ${
                    isMiddle ? 'border-x border-[var(--border)]' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFilterGroup(isOpen ? null : group.title)}
                    className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-ink uppercase tracking-wider hover:bg-white/50 transition-colors py-1 px-2 rounded"
                  >
                    <span className="truncate">{group.title}</span>
                    {count > 0 && (
                      <span className="text-[9px] font-normal text-green bg-green/10 px-1.5 py-0.5 rounded">
                        {count}
                      </span>
                    )}
                    <svg
                      className={`w-3 h-3 text-ink-muted transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className={`absolute top-full mt-1 bg-white border border-[var(--border)] rounded-xl shadow-lg py-2 px-3 z-[100] min-w-[150px] ${index === 0 ? 'left-0' : index === FILTER_GROUPS.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                      {group.items.map(({ key, label }) => {
                        const checked = filters.has(key)
                        return (
                          <label
                            key={key}
                            className="flex items-center gap-2 text-[12px] text-ink-soft cursor-pointer select-none py-1"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleFilter(key)}
                              className="w-3.5 h-3.5 rounded border-[var(--border)] text-green focus:ring-green/30 cursor-pointer"
                            />
                            <span className={checked ? 'font-medium text-ink' : ''}>{label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            {filters.size > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 text-[10px] font-medium text-green hover:underline flex-shrink-0 self-center"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort + results count */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-[#E8E6E1] bg-white">
            <span className="text-[12px] text-ink-muted">
              <b className="font-bold text-ink">{sorted.length}</b> results
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="min-w-[120px] px-2.5 py-1.5 bg-cream border border-[#E8E6E1] rounded-lg text-[12px] font-medium text-ink-soft appearance-none cursor-pointer outline-none pr-6 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A8A8A%22%20stroke-width%3D%222.5%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]"
              >
                <option value="name">Name A→Z</option>
                <option value="courts">Most Courts</option>
                <option value="price">Lowest Price</option>
                <option value="distance">Distance</option>
              </select>
            </div>
          </div>

          {/* Distance: manual suburb input fallback */}
          {sortBy === 'distance' && showManualInput && (
            <div className="px-4 py-2.5 bg-[#FFF8E1] border-b border-[rgba(232,168,48,0.2)]">
              <p className="text-[11px] text-[#9A6D00] mb-2">
                {locationStatus === 'denied'
                  ? 'Location access denied. Enter a suburb instead:'
                  : 'Enter your suburb for distance sorting:'}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualSuburb}
                  onChange={(e) => setManualSuburb(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyManualSuburb()}
                  placeholder="e.g. Chatswood"
                  className="flex-1 px-3 py-1.5 border border-[#E8E6E1] rounded-lg text-[12px] text-ink bg-white outline-none focus:border-green"
                />
                <button
                  type="button"
                  onClick={applyManualSuburb}
                  className="px-3 py-1.5 bg-green text-white rounded-lg text-[11px] font-semibold hover:bg-[#259A66]"
                >
                  Set
                </button>
              </div>
            </div>
          )}
          {sortBy === 'distance' && locationStatus === 'loading' && (
            <div className="px-4 py-2 bg-cream border-b border-[#E8E6E1] text-[11px] text-ink-muted">
              📍 Getting your location…
            </div>
          )}

          {/* Court list */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 scrollbar-thin">
            {sorted.length === 0 ? (
              <div className="text-center py-12 text-ink-muted text-sm">No courts match your filters.</div>
            ) : (
              sorted.map((court) => {
                const isSelected = selectedId === court.id
                const surfaceLabel = SURFACE_LABELS[court.surface] || court.surface
                const dist =
                  sortBy === 'distance' && userLat !== null && userLng !== null
                    ? haversine(userLat, userLng, court.lat, court.lng)
                    : null

                return (
                  <div
                    key={court.id}
                    data-id={court.id}
                    onClick={() => selectCourt(court.id)}
                    className={`rounded-[14px] p-3.5 cursor-pointer transition-all duration-200 border-2 ${
                      isSelected
                        ? 'bg-[#F7FDF9] border-[#2DB87A] shadow-sm ring-2 ring-[#2DB87A18]'
                        : 'bg-white border-[#E8E6E1] hover:border-[#B8D42A] hover:shadow-md hover:-translate-y-px'
                    }`}
                  >
                    {/* Name + suburb */}
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="text-[13px] font-semibold text-ink leading-tight flex-1 mr-2">
                        {court.name}
                      </h3>
                      {dist !== null && (
                        <span className="text-[10px] font-medium text-ink-muted whitespace-nowrap">
                          {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-muted mb-2">{court.suburb}</p>

                    {/* Tags — consistent with filter labels */}
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#E6F1FB] text-[#0C447C]">
                        {surfaceLabel}
                      </span>
                      {court.lights ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#FFF8E1] text-[#633806]">
                          Lights
                        </span>
                      ) : null}
                      {court.outdoor ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#E1F5EE] text-[#0F6E56]">
                          Outdoor
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#EEEDFE] text-[#26215C]">
                          Indoor
                        </span>
                      )}
                      {court.parking ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#E8F4FD] text-[#2878A8]">
                          Parking
                        </span>
                      ) : null}
                      {court.toilet ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#F3F0FF] text-[#5B47A8]">
                          Toilet
                        </span>
                      ) : null}
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-green/10 text-green">
                        {court.courts_count} Courts
                      </span>
                    </div>

                    {/* Price + buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE8]">
                      <span className="text-[15px] font-bold text-green">
                        ${court.price_per_hr}
                        <span className="text-[10px] font-normal text-ink-muted">/hr</span>
                      </span>
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleViewDetail(court.id)}
                          className="px-3 py-1.5 text-[10px] font-medium rounded-lg border border-[var(--border)] text-ink hover:bg-cream transition-colors"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickBook(court.id)}
                          className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-[#1A7A4F] text-white hover:bg-[#145F3C] transition-colors"
                        >
                          Quick book
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ══ RIGHT: Map ══ */}
        <div className="flex-1 relative">
          <CourtMap
            courts={sorted}
            selectedId={selectedId}
            onSelectCourt={selectCourt}
            onBookCourt={handleQuickBook}
            onViewDetail={handleViewDetail}
            userPosition={userLat !== null && userLng !== null ? { lat: userLat, lng: userLng } : null}
          />
        </div>
      </div>

      {/* Quick Book Modal (same as Discover page) */}
      {quickBookVenue && (
        <QuickBookModal venue={quickBookVenue} onClose={() => setQuickBookVenue(null)} />
      )}
    </div>
  )
}
