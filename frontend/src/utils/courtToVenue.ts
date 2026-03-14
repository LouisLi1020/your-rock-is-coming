/**
 * Map backend Court to frontend Venue so we can reuse VenueCard, VenueMap, filters.
 */
import type { Court } from '../api/courts'
import type { Venue } from '../data/venues'

// A curated set of real tennis court photos from Unsplash
// 全部是明确的网球场场景，尽量避免裂图 / 非网球
const COURT_IMAGES: string[] = [
  // 用户给出的几张 + 我补充的 Pexels tennis court 图片
  'https://images.pexels.com/photos/12806376/pexels-photo-12806376.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/12806332/pexels-photo-12806332.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/12645021/pexels-photo-12645021.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/12436050/pexels-photo-12436050.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/16639180/pexels-photo-16639180.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/9388930/pexels-photo-9388930.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/17299533/pexels-photo-17299533.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/13025827/pexels-photo-13025827.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/10145724/pexels-photo-10145724.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/7216339/pexels-photo-7216339.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/8224759/pexels-photo-8224759.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/6010282/pexels-photo-6010282.jpeg?auto=compress&cs=tinysrgb&w=1200',
]

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
      : court.surface === 'clay'
        ? ['Clay']
        : court.surface === 'synthetic_clay'
          ? ['Synthetic Clay']
          : court.surface === 'grass'
            ? ['Grass']
            : ['Synthetic', 'Artificial Grass']

  // 前 12 个 id 优先一人一图，后面的再取模分配，尽量减少重复
  let imageIndex: number
  if (court.id > 0 && court.id <= COURT_IMAGES.length) {
    imageIndex = court.id - 1
  } else {
    imageIndex = Math.abs(court.id) % COURT_IMAGES.length
  }
  const image = COURT_IMAGES[imageIndex]

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
    image,
    priceRange: `$${court.price_per_hr} per hour`,
    lat: court.lat,
    lng: court.lng,
    amenities: (() => {
      const a: string[] = []
      if (court.parking === 1) a.push('Parking')
      if (court.toilet) a.push('Toilet')
      return a.length ? a : undefined
    })(),
    price_per_hr: court.price_per_hr,
    lights_price: court.lights_price,
    open_hour: court.open_hour,
    close_hour: court.close_hour,
    surface_api: court.surface,
  }
}
