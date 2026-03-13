/** Venue type aligned with Figma design + map + booking */
export type Venue = {
  id: string
  name: string
  suburb: string
  address: string
  openingHours: string
  /** Display string e.g. "2 hard courts, 2 artificial grass" */
  surface?: string
  /** For filters: Hard Court, Grass, Clay, Synthetic */
  surfaceTypes: string[]
  indoor: boolean
  outdoor: boolean
  nightLighting: boolean
  courts?: number
  contact?: string
  website?: string
  image: string
  priceRange: string
  /** For map */
  lat: number
  lng: number
  amenities?: string[]
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80'

export const venues: Venue[] = [
  {
    id: 'gordon-recreation-ground',
    name: 'Gordon Recreation Ground Tennis Courts',
    suburb: 'Gordon',
    address: 'Gordon Recreation Ground, Park Ave, Gordon NSW 2072',
    openingHours: 'Mon–Sun: 7:00 AM – 8:00 PM',
    surface: '2 hard courts, 2 artificial grass',
    surfaceTypes: ['Hard Court', 'Artificial Grass'],
    indoor: false,
    outdoor: true,
    nightLighting: false,
    courts: 4,
    contact: '(02) 9424 0000',
    website: 'https://www.krg.nsw.gov.au/Things-to-do/Parks-playgrounds-and-sportsfields/Gordon-Recreation-Ground-tennis-courts',
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80',
    priceRange: '$16.50–19.50 per hour',
    lat: -33.756,
    lng: 151.152,
    amenities: ['Parking', 'Toilets', 'Playground'],
  },
  {
    id: 'sydney-olympic-park',
    name: 'Sydney Olympic Park Tennis Centre',
    suburb: 'Sydney Olympic Park',
    address: 'Rod Laver Drive, Sydney Olympic Park NSW 2127',
    openingHours: 'Mon–Sun: 7:00 AM – 10:00 PM',
    surface: 'Hard courts',
    surfaceTypes: ['Hard Court', 'Synthetic'],
    indoor: true,
    outdoor: true,
    nightLighting: true,
    courts: 16,
    contact: '(02) 9746 7000',
    website: 'https://www.sydneyolympicpark.com.au/Tennis',
    image: 'https://images.unsplash.com/photo-1766675122854-28fc70f50132?w=800&q=80',
    priceRange: '$25–45 per hour',
    lat: -33.847,
    lng: 151.069,
    amenities: ['Parking', 'Toilets', 'Pro shop', 'Cafe'],
  },
  {
    id: 'white-city',
    name: 'White City Tennis Club',
    suburb: 'Paddington',
    address: '40 Alma Street, Paddington NSW 2021',
    openingHours: 'Mon–Fri: 6:00 AM – 10:00 PM, Sat–Sun: 7:00 AM – 9:00 PM',
    surface: 'Grass, Hard Court',
    surfaceTypes: ['Grass', 'Hard Court'],
    indoor: false,
    outdoor: true,
    nightLighting: true,
    courts: 8,
    contact: '(02) 9331 4911',
    website: 'https://www.whitecitytennisclub.com.au',
    image: 'https://images.unsplash.com/photo-1717014178120-670190ab0497?w=800&q=80',
    priceRange: '$30–50 per hour',
    lat: -33.884,
    lng: 151.226,
  },
  {
    id: 'cooper-park',
    name: 'Cooper Park Tennis',
    suburb: 'Bellevue Hill',
    address: 'Cooper Park, Bellevue Rd, Bellevue Hill NSW',
    openingHours: 'Mon–Sun: 7:00 AM – 9:00 PM',
    surface: 'Synthetic grass',
    surfaceTypes: ['Synthetic'],
    indoor: false,
    outdoor: true,
    nightLighting: true,
    courts: 6,
    contact: '(02) 9389 6160',
    website: 'https://www.cooperparktennis.com.au/',
    image: 'https://images.unsplash.com/photo-1709587825099-f6f07e5337af?w=800&q=80',
    priceRange: '$28 per hour',
    lat: -33.879,
    lng: 151.257,
    amenities: ['Parking', 'Toilets'],
  },
  {
    id: 'bondi-tennis',
    name: 'Bondi Tennis Club',
    suburb: 'Bondi',
    address: 'Queen Elizabeth Drive, Bondi Beach NSW 2026',
    openingHours: 'Mon–Sun: 7:00 AM – 9:00 PM',
    surface: 'Hard Court',
    surfaceTypes: ['Hard Court'],
    indoor: false,
    outdoor: true,
    nightLighting: true,
    contact: '(02) 9130 3648',
    website: 'https://www.bonditennisclub.com.au',
    image: 'https://images.unsplash.com/photo-1625235441865-e9ae558348b7?w=800&q=80',
    priceRange: '$28–48 per hour',
    lat: -33.891,
    lng: 151.277,
  },
  {
    id: 'alexandria-park',
    name: 'Alexandria Park Tennis Courts',
    suburb: 'Alexandria',
    address: 'Park Rd, Alexandria NSW',
    openingHours: 'Mon–Sun: 7:00 AM – 10:00 PM',
    surface: 'Hard courts',
    surfaceTypes: ['Hard Court'],
    indoor: false,
    outdoor: true,
    nightLighting: true,
    courts: 4,
    contact: '(02) 8399 3586',
    website: 'https://alexandriaparktennis.com.au/',
    image: DEFAULT_IMAGE,
    priceRange: '$22–26 per hour',
    lat: -33.905,
    lng: 151.199,
    amenities: ['Parking', 'Toilets', 'Water'],
  },
  {
    id: 'coogee-tennis',
    name: 'Coogee Tennis Club',
    suburb: 'Coogee',
    address: 'Grant Reserve, Coogee Bay Road, Coogee NSW 2034',
    openingHours: 'Mon–Sun: 7:00 AM – 7:00 PM',
    surface: 'Hard Court',
    surfaceTypes: ['Hard Court'],
    indoor: false,
    outdoor: true,
    nightLighting: false,
    contact: '(02) 9665 7419',
    website: 'https://www.coogeetennisclub.com',
    image: 'https://images.unsplash.com/photo-1766675122854-28fc70f50132?w=800&q=80',
    priceRange: '$25–40 per hour',
    lat: -33.923,
    lng: 151.256,
  },
  {
    id: 'north-sydney',
    name: 'North Sydney Tennis Centre',
    suburb: 'North Sydney',
    address: 'Montague Street, North Sydney NSW 2060',
    openingHours: 'Mon–Sun: 7:00 AM – 10:00 PM',
    surface: 'Hard Court',
    surfaceTypes: ['Hard Court'],
    indoor: true,
    outdoor: false,
    nightLighting: true,
    contact: '(02) 9955 2309',
    website: 'https://www.northsydneytennis.com.au',
    image: 'https://images.unsplash.com/photo-1658491830143-72808ca237e3?w=800&q=80',
    priceRange: '$32–55 per hour',
    lat: -33.838,
    lng: 151.207,
  },
]

export function getVenueById(id: string): Venue | undefined {
  return venues.find((v) => v.id === id)
}

/** Sydney CBD for map default center */
export const SYDNEY_CENTER = { lat: -33.8688, lng: 151.2093 } as const
