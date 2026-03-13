import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { Venue } from '../data/venues'

interface VenueCardProps {
  venue: Venue
  selected?: boolean
  onQuickBook?: (venue: Venue) => void
}

const surfaceBadgeClass: Record<string, string> = {
  'Hard Court': 'bg-[#E6F1FB] text-[#0C447C]',
  Clay: 'bg-[#FAECE7] text-[#712B13]',
  Grass: 'bg-[#EAF3DE] text-[#27500A]',
  Synthetic: 'bg-[#EEEDFE] text-[#26215C]',
  'Artificial Grass': 'bg-[#E1F5EE] text-[#0F6E56]',
}

export function VenueCard({ venue, selected, onQuickBook }: VenueCardProps) {
  const surfaceClass = venue.surfaceTypes[0] ? surfaceBadgeClass[venue.surfaceTypes[0]] || 'bg-g50 text-g800' : 'bg-g50 text-g800'

  return (
    <div
      id={`venue-card-${venue.id}`}
      className={`bg-white border rounded-[16px] overflow-hidden transition-colors ${
        selected ? 'border-g200 ring-2 ring-g200/30' : 'border-[var(--border)] hover:border-g200'
      }`}
    >
      <div className="h-28 relative flex items-end p-2.5 bg-g50">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 260 110" className="w-full h-full text-g600">
            <rect x="20" y="10" width="220" height="90" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="130" y1="10" x2="130" y2="100" stroke="currentColor" strokeWidth="1" />
            <line x1="20" y1="55" x2="240" y2="55" stroke="currentColor" strokeWidth="1" />
            <ellipse cx="130" cy="55" rx="22" ry="22" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-wrap gap-1">
          {venue.surfaceTypes.slice(0, 2).map((s, i) => (
            <span
              key={i}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                surfaceBadgeClass[s] || surfaceClass
              }`}
            >
              {s.replace(' Court', '').replace(' Artificial Grass', 'Synth')}
            </span>
          ))}
          {venue.nightLighting && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-a50 text-[#633806] uppercase">
              Lights
            </span>
          )}
          {venue.outdoor && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-t50 text-t600 uppercase">
              Outdoor
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-lora text-sm font-semibold text-bark mb-1">{venue.name}</h3>
        <div className="flex items-center gap-1 text-[11px] text-bark-lt mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{venue.suburb}</span>
        </div>
        {venue.amenities && venue.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 text-[10px] text-bark-lt">
            {venue.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-g100" />
                {a}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-bark-lt">{venue.courts ?? '—'} courts</span>
          <span className="font-lora text-[15px] font-semibold text-g600">
            {venue.priceRange.split(' ')[0]}
            <span className="font-sans text-[10px] font-normal text-bark-lt">/hr</span>
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/venue/${venue.id}`}
            className="flex-1 py-2 text-center text-xs font-medium rounded-xl border border-[var(--border)] text-bark hover:bg-g50 transition-colors"
          >
            View detail
          </Link>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onQuickBook?.(venue) }}
            className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-g600 text-white hover:bg-g800 transition-colors"
          >
            Quick book
          </button>
        </div>
      </div>
    </div>
  )
}
