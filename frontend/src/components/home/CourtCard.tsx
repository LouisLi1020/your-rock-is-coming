// src/components/home/CourtCard.tsx
import type { Court } from '../../api/courts'
import type { WeatherData } from '../../api/weather'
import { weatherEmoji } from '../../api/weather'

type Props = {
  court: Court
  selected: boolean
  weather?: WeatherData | null
  onSelect: (id: number) => void
  onBook: (id: number) => void
}

export function CourtCard({ court, selected, weather, onSelect, onBook }: Props) {
  const isSynth = court.surface === 'synthetic_grass'
  const rainy = weather && weather.rain_prob >= 50

  return (
    <div
      data-id={court.id}
      onClick={() => onSelect(court.id)}
      className={`
        bg-white rounded-[14px] p-4 cursor-pointer transition-all duration-200 border-[1.5px]
        ${selected
          ? 'border-green shadow-md ring-[3px] ring-green/10'
          : 'border-[#E8E6E1] hover:border-accent-hover hover:shadow-md hover:-translate-y-px'
        }
      `}
    >
      {/* Top row */}
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-sm font-semibold text-ink leading-tight flex-1 mr-2">
          {court.name}
        </h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 bg-cream border border-[#E8E6E1] rounded-full text-ink-muted uppercase tracking-wide whitespace-nowrap">
          {court.suburb}
        </span>
      </div>

      <p className="text-[11.5px] text-ink-muted mb-2">{court.address}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-[5px] mb-2.5">
        <span className={`text-[10px] px-[7px] py-[3px] rounded-[6px] font-medium ${isSynth ? 'bg-[#FFF4E0] text-[#A67B00]' : 'bg-[#EEF0FF] text-[#4F5AC7]'}`}>
          {isSynth ? 'Synthetic' : 'Hard Court'}
        </span>
        <span className="text-[10px] px-[7px] py-[3px] rounded-[6px] font-medium bg-green/10 text-green-text">
          🎾 {court.courts_count}
        </span>
        {court.lights ? (
          <span className="text-[10px] px-[7px] py-[3px] rounded-[6px] font-medium bg-[#FFF8E1] text-[#B8860B]">💡 Lights</span>
        ) : (
          <span className="text-[10px] px-[7px] py-[3px] rounded-[6px] font-medium bg-cream text-ink-faint">No Lights</span>
        )}
        {court.parking ? (
          <span className="text-[10px] px-[7px] py-[3px] rounded-[6px] font-medium bg-[#E8F4FD] text-[#2878A8]">🅿️</span>
        ) : null}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE8]">
        <span className="text-base font-bold text-green">
          ${court.price_per_hr}<span className="text-[11px] font-normal text-ink-muted">/hr</span>
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onBook(court.id) }}
          className="px-3.5 py-1.5 bg-accent text-ink text-[11px] font-semibold rounded-[10px] hover:bg-accent-hover transition-all"
        >
          Book →
        </button>
      </div>

      {/* Weather row */}
      {weather && weather.description && !weather.description.includes('unavailable') && !weather.description.includes('API_KEY') && (
        <div className={`flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-[6px] text-[11px] font-medium ${rainy ? 'bg-warning/10 border border-warning/20 text-[#9A6D00]' : 'bg-[#E8F8FF] border border-[rgba(96,165,250,0.15)] text-[#4A90B8]'}`}>
          {weatherEmoji(weather.icon)} {Math.round(weather.temp_max || 0)}°C · {weather.description} · 🌧 {weather.rain_prob || 0}%
        </div>
      )}
    </div>
  )
}
