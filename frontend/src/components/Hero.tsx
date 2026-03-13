import { useState } from 'react'
import { Search } from 'lucide-react'
import { WeatherWidget } from './WeatherWidget'

interface HeroProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  onSearchSubmit?: () => void
}

export function Hero({ searchQuery, onSearchChange, onSearchSubmit }: HeroProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-t400 mb-3">
            Sydney Tennis Platform
          </p>
          <h1 className="font-lora text-3xl sm:text-4xl font-semibold text-bark leading-tight mb-3">
            Find & book your <em className="italic text-g600 not-italic">perfect court</em> — rain or shine
          </h1>
          <p className="text-sm text-bark-lt leading-relaxed mb-6">
            Every tennis club, venue, and court across Sydney in one place. Browse, book, and handle the weather.
          </p>
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
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
              className="flex-1 border-0 outline-none py-2.5 px-3 text-sm text-bark bg-transparent placeholder:text-[#b0a898]"
            />
            <button
              type="button"
              onClick={onSearchSubmit}
              className="bg-g600 text-white px-4 py-2.5 text-xs font-semibold hover:bg-g800 transition-colors whitespace-nowrap"
            >
              Find courts
            </button>
          </div>
        </div>
        <div className="hidden lg:block">
          <WeatherWidget />
        </div>
      </div>
    </div>
  )
}
