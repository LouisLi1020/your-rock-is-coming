export type Venue = {
  id: string
  name: string
  suburb: string
  address: string
  openingHours: string
  surface?: string
  courts?: number
  contact?: string
  website?: string // ready for v2: link out to booking/info
}

// Seed data for v1.0 — can later be replaced by API or scraped data.
export const venues: Venue[] = [
  {
    id: 'sydney-olympic-park',
    name: 'Sydney Olympic Park Tennis Centre',
    suburb: 'Homebush',
    address: 'Rod Laver Dr, Sydney Olympic Park NSW',
    openingHours: 'Mon–Sun · 7:00am – 10:00pm',
    surface: 'Hard courts',
    courts: 16,
    contact: '(02) 9746 7000',
    website: 'https://www.sydneyolympicpark.com.au/Tennis',
  },
  {
    id: 'cooper-park',
    name: 'Cooper Park Tennis',
    suburb: 'Bellevue Hill',
    address: 'Cooper Park, Bellevue Rd, Bellevue Hill NSW',
    openingHours: 'Mon–Sun · 7:00am – 9:00pm',
    surface: 'Synthetic grass',
    courts: 6,
    contact: '(02) 9389 6160',
    website: 'https://www.cooperparktennis.com.au/',
  },
  {
    id: 'alexandria-park',
    name: 'Alexandria Park Tennis Courts',
    suburb: 'Alexandria',
    address: 'Park Rd, Alexandria NSW',
    openingHours: 'Mon–Sun · 7:00am – 10:00pm',
    surface: 'Hard courts',
    courts: 4,
    contact: '(02) 8399 3586',
    website: 'https://alexandriaparktennis.com.au/',
  },
]
