import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { Venue } from '../data/venues'

interface VenueCardProps {
  venue: Venue
  selected?: boolean
  onSelect?: (id: string) => void
  onQuickBook?: (venue: Venue) => void
}

/* Label map — consistent with FilterChips */
const SURFACE_BADGE: Record<string, { label: string; className: string }> = {
  'Hard Court': { label: 'Hard Court', className: 'bg-[#E6F1FB] text-[#0C447C]' },
  Clay: { label: 'Clay', className: 'bg-[#FAECE7] text-[#712B13]' },
  'Synthetic Clay': { label: 'Synthetic Clay', className: 'bg-[#FAECE7] text-[#712B13]' },
  Grass: { label: 'Grass', className: 'bg-[#EAF3DE] text-[#27500A]' },
  Synthetic: { label: 'Synthetic Grass', className: 'bg-[#EEEDFE] text-[#26215C]' },
  'Artificial Grass': { label: 'Synthetic Grass', className: 'bg-[#E1F5EE] text-[#0F6E56]' },
  'Synthetic Grass': { label: 'Synthetic Grass', className: 'bg-[#E1F5EE] text-[#0F6E56]' },
}

const DEFAULT_BADGE = { label: 'Court', className: 'bg-g50 text-g800' }

export function VenueCard({ venue, selected, onSelect, onQuickBook }: VenueCardProps) {
  return (
    <div
      id={`venue-card-${venue.id}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a, button') == null) onSelect?.(venue.id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if ((e.target as HTMLElement).closest('a, button') == null) onSelect?.(venue.id)
        }
      }}
      className={`rounded-[16px] overflow-hidden transition-all duration-200 border-2 cursor-pointer ${
        selected
          ? 'bg-[#F7FDF9] border-[#2DB87A] shadow-sm ring-2 ring-[#2DB87A18]'
          : 'bg-white border-[var(--border)] hover:border-g200'
      }`}
    >
      <div className="h-28 relative overflow-hidden">
        <img
          src={venue.image}
          alt={venue.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute left-2.5 bottom-2.5 right-2.5 flex flex-wrap gap-1">
          {venue.surfaceTypes.slice(0, 2).map((s, i) => {
            const badge = SURFACE_BADGE[s] || DEFAULT_BADGE
            return (
              <span
                key={i}
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${badge.className}`}
              >
                {badge.label}
              </span>
            )
          })}
          {venue.nightLighting && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#FFF8E1] text-[#633806] uppercase tracking-wider">
              Lights
            </span>
          )}
          {venue.outdoor && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#E1F5EE] text-[#0F6E56] uppercase tracking-wider">
              Outdoor
            </span>
          )}
          {!venue.outdoor && venue.indoor && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#EEEDFE] text-[#26215C] uppercase tracking-wider">
              Indoor
            </span>
          )}
          {venue.amenities?.includes('Parking') && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#E8F4FD] text-[#2878A8] uppercase tracking-wider">
              Parking
            </span>
          )}
          {venue.amenities?.includes('Toilet') && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#F3F0FF] text-[#5B47A8] uppercase tracking-wider">
              Toilet
            </span>
          )}
          {(venue.courts ?? 0) > 0 && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#16A34A] text-white shadow-sm">
              {venue.courts} Courts
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
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            to={`/venue/${venue.id}`}
            className="flex-1 py-2 text-center text-xs font-medium rounded-xl border border-[var(--border)] text-bark hover:bg-g50 transition-colors"
          >
            View detail
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onQuickBook?.(venue)
            }}
            className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-g600 text-white hover:bg-g800 transition-colors"
          >
            Quick book
          </button>
        </div>
      </div>
    </div>
  )
}