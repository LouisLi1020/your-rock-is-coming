import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { WeatherWidget } from './WeatherWidget'

interface HeroProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  onSearchSubmit?: () => void
  /** All available suburbs extracted from venues, for autocomplete */
  suburbs?: string[]
}

export function Hero({ searchQuery, onSearchChange, onSearchSubmit, suburbs = [] }: HeroProps) {
  const [focused, setFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Dedupe + sort suburbs
  const uniqueSuburbs = [...new Set(suburbs)].sort()

  // Filter suggestions based on input
  const suggestions = searchQuery.trim().length > 0
    ? uniqueSuburbs.filter((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleSelect = (suburb: string) => {
    onSearchChange(suburb)
    setShowDropdown(false)
  }

  const handleInputChange = (value: string) => {
    onSearchChange(value)
    setShowDropdown(true)
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="w-full pt-8 sm:pt-10 pb-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-t400 mb-3">
            Sydney Tennis Platform
          </p>
          <h1 className="font-lora text-3xl sm:text-4xl font-semibold text-bark leading-tight mb-3">
            Find &amp; book your <em className="italic text-g600 not-italic">perfect court</em> — rain or shine
          </h1>
          <p className="text-sm text-bark-lt leading-relaxed mb-6">
            Every tennis club, venue, and court across Sydney in one place. Browse, book, and handle the weather.
          </p>

          {/* Search bar with autocomplete */}
          <div ref={wrapperRef} className="relative">
            <div
              className={`flex bg-white border rounded-xl overflow-hidden transition-colors ${
                focused ? 'border-g200 shadow-sm' : 'border-[#d8d0c4]'
              }`}
            >
              <Search className="w-5 h-5 text-bark-lt flex-shrink-0 ml-3 self-center" />
              <input
                type="text"
                placeholder="Suburb, venue, or surface…"
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => { setFocused(true); if (searchQuery.trim()) setShowDropdown(true) }}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowDropdown(false)
                    onSearchSubmit?.()
                  }
                  if (e.key === 'Escape') setShowDropdown(false)
                }}
                className="flex-1 border-0 outline-none py-2.5 px-3 text-sm text-bark bg-transparent placeholder:text-[#b0a898]"
              />
              <button
                type="button"
                onClick={() => { setShowDropdown(false); onSearchSubmit?.() }}
                className="bg-g600 text-white px-4 py-2.5 text-xs font-semibold hover:bg-g800 transition-colors whitespace-nowrap"
              >
                Find courts
              </button>
            </div>

            {/* Suburb autocomplete dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-xl shadow-lg z-[3000] max-h-[220px] overflow-y-auto py-1">
                {suggestions.map((suburb) => {
                  // Highlight matched text
                  const idx = suburb.toLowerCase().indexOf(searchQuery.toLowerCase())
                  const before = suburb.slice(0, idx)
                  const match = suburb.slice(idx, idx + searchQuery.length)
                  const after = suburb.slice(idx + searchQuery.length)

                  return (
                    <button
                      key={suburb}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                      onClick={() => handleSelect(suburb)}
                      className="w-full text-left px-4 py-2 text-sm text-bark hover:bg-[var(--cream)] transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-bark-lt flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        {before}<strong className="font-semibold text-g600">{match}</strong>{after}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="hidden lg:block">
          <WeatherWidget suburbs={suburbs} />
        </div>
      </div>
    </div>
  )
}
