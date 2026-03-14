/**
 * Map backend Court to frontend Venue so we can reuse VenueCard, VenueMap, filters.
 */
import type { Court } from '../api/courts'
import type { Venue } from '../data/venues'

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80'

function formatHour(h: number): string {
  if (h === 0) return '12:00 AM'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

export function courtToVenue(court: Court): Venue {
  const surfaceTypes =
    court.surface === 'hard'
      ? ['Hard Court']
      : ['Synthetic', 'Artificial Grass']

  return {
    id: String(court.id),
    name: court.name,
    suburb: court.suburb,
    address: court.address,
    openingHours: `Mon–Sun: ${formatHour(court.open_hour)} – ${formatHour(court.close_hour)}`,
    surface: `${court.courts_count} ${court.surface === 'hard' ? 'hard' : 'synthetic grass'} court(s)`,
    surfaceTypes,
    indoor: court.outdoor === 0,
    outdoor: court.outdoor === 1,
    nightLighting: court.lights === 1,
    courts: court.courts_count,
    contact: court.phone || undefined,
    website: court.email ? undefined : undefined,
    image: DEFAULT_IMAGE,
    priceRange: `$${court.price_per_hr} per hour`,
    lat: court.lat,
    lng: court.lng,
    amenities: court.parking === 1 ? ['Parking'] : undefined,
    price_per_hr: court.price_per_hr,
    lights_price: court.lights_price,
    open_hour: court.open_hour,
    close_hour: court.close_hour,
    surface_api: court.surface,
  }
}
