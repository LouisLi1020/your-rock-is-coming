// src/components/home/LeftPanel.tsx
import type { WeatherData } from '../../api/weather'
import { weatherEmoji } from '../../api/weather'

type FilterSet = Set<string>

type Props = {
  searchQuery: string
  onSearchChange: (q: string) => void
  filters: FilterSet
  onToggleFilter: (f: string) => void
  onClearFilters: () => void
  sortBy: string
  onSortChange: (s: string) => void
  weather: WeatherData | null
  onOpenBookings: () => void
  onBookRecommended: () => void
}

const FILTER_OPTIONS = [
  { key: 'lights', icon: '💡', label: 'Lights Available' },
  { key: 'parking', icon: '🅿️', label: 'Parking' },
  { key: 'hard', icon: '🧱', label: 'Hard Court' },
  { key: 'synthetic', icon: '🌿', label: 'Synthetic Grass' },
  { key: '4courts', icon: '🎾', label: '4+ Courts' },
]

export function LeftPanel({
  searchQuery, onSearchChange, filters, onToggleFilter, onClearFilters,
  sortBy, onSortChange, weather, onOpenBookings, onBookRecommended,
}: Props) {
  return (
    <div className="w-[280px] min-w-[280px] h-screen flex flex-col bg-white border-r border-[#E8E6E1] z-10 overflow-y-auto scrollbar-thin">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F0EDE8]">
        <div className="flex items-center gap-2.5">
          <div className="w-[38px] h-[38px] bg-accent rounded-[10px] flex items-center justify-center text-[19px] shadow-[0_2px_8px_rgba(200,230,50,0.25)]">
            🎾
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-tight">
              Court<span className="text-green">Finder</span>
            </div>
            <div className="text-[10px] font-medium text-ink-muted uppercase tracking-[1.2px] -mt-px">
              Sydney Tennis Courts
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 bg-cream border-[1.5px] border-[#E8E6E1] rounded-[14px] px-3.5 py-2.5 transition-all focus-within:border-green focus-within:ring-[3px] focus-within:ring-green/10 focus-within:bg-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted flex-shrink-0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search courts..."
            className="flex-1 bg-transparent border-none text-[13px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-ink-muted">Filters</span>
          {filters.size > 0 && (
            <button onClick={onClearFilters} className="text-[11px] text-green font-medium hover:underline">Clear</button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {FILTER_OPTIONS.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => onToggleFilter(key)}
              className={`
                flex items-center gap-2 w-full px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all text-left
                ${filters.has(key)
                  ? 'bg-accent/15 border-[1.5px] border-accent-hover text-accent-text font-semibold'
                  : 'bg-cream border-[1.5px] border-[#E8E6E1] text-ink-soft hover:border-ink-faint hover:bg-cream-dark'
                }
              `}
            >
              <span className="text-[15px] w-5 text-center">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="px-5 pb-4">
        <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-ink-muted mb-2.5">Sort By</div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-cream border-[1.5px] border-[#E8E6E1] rounded-[10px] text-ink-soft text-[13px] font-medium appearance-none cursor-pointer outline-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A8A8A%22%20stroke-width%3D%222.5%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center] pr-8"
        >
          <option value="name">Name A → Z</option>
          <option value="courts">Most Courts</option>
          <option value="suburb">Suburb</option>
        </select>
      </div>

      <div className="h-px bg-[#F0EDE8] mx-5 mb-4" />

      {/* Weather */}
      <div className="px-5 pb-4">
        <div className="bg-gradient-to-br from-[#E8F8FF] to-[#F0FAFE] border-[1.5px] border-[rgba(96,165,250,0.2)] rounded-[14px] p-4">
          <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A90B8] mb-2">☁️ Today's Weather</div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[28px]">{weather ? weatherEmoji(weather.icon) : '🌤'}</span>
            <span className="text-xl font-bold text-ink">
              {weather?.temp_max != null ? `${Math.round(weather.temp_max)}°` : '–'}
              <small className="text-[13px] font-normal text-ink-muted"> / {weather?.temp_min != null ? `${Math.round(weather.temp_min)}°C` : '–'}</small>
            </span>
          </div>
          <div className="text-xs text-ink-muted capitalize mb-1.5">{weather?.description || '–'}</div>
          <div className="flex gap-3 text-[11px] text-ink-muted">
            <span className={weather && weather.rain_prob >= 50 ? 'text-warning font-semibold' : ''}>
              🌧 {weather?.rain_prob ?? 0}%
            </span>
            <span>💨 {weather?.wind_speed ?? 0} m/s</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#F0EDE8] mx-5 mb-4" />

      {/* Recommendation */}
      <div className="px-5 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-ink-muted mb-2.5">Recommended</div>
        <div className="bg-gradient-to-br from-[#F0FAF2] to-[#FAFFF0] border-[1.5px] border-[rgba(45,184,122,0.2)] rounded-[14px] p-[18px] relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-20 h-20 bg-accent opacity-[0.12] rounded-full" />
          <div className="inline-flex items-center gap-[5px] text-[10px] font-bold uppercase tracking-[1px] text-green mb-2.5 bg-green/10 px-2.5 py-1 rounded-full">⭐ Top Pick</div>
          <div className="text-base font-bold leading-tight mb-1">St Ives Village Green</div>
          <div className="text-xs text-ink-muted mb-3 leading-relaxed">4 hard courts with lights, open till 10pm. Parking available.</div>
          <div className="flex gap-2 mb-3.5 flex-wrap">
            <span className="text-[11px] px-2 py-1 rounded-[6px] bg-white border border-[#F0EDE8] text-ink-soft font-medium">🎾 4 courts</span>
            <span className="text-[11px] px-2 py-1 rounded-[6px] bg-white border border-[#F0EDE8] text-ink-soft font-medium">💡 Lights</span>
            <span className="text-[11px] px-2 py-1 rounded-[6px] bg-white border border-[#F0EDE8] text-ink-soft font-medium">🅿️ Parking</span>
          </div>
          <div className="text-xl font-extrabold text-green mb-3">$22<small className="text-xs font-normal text-ink-muted">/hr</small></div>
          <button
            onClick={onBookRecommended}
            className="w-full py-2.5 text-center bg-green text-white rounded-[10px] text-[13px] font-semibold hover:opacity-90 hover:-translate-y-px transition-all"
          >
            Book This Court →
          </button>
        </div>
      </div>

      <div className="h-px bg-[#F0EDE8] mx-5 mb-4" />

      {/* My Bookings link */}
      <button
        onClick={onOpenBookings}
        className="flex items-center justify-center gap-1.5 mx-5 mb-4 py-2.5 bg-cream border-[1.5px] border-[#E8E6E1] rounded-[10px] text-[13px] font-medium text-ink-soft hover:border-green hover:text-green transition-all"
      >
        📋 My schedule
      </button>
    </div>
  )
}
