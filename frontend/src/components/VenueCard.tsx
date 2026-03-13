import { Link } from 'react-router-dom'
import { MapPin, Clock, Sun, Moon } from 'lucide-react'
import type { Venue } from '../data/venues'
import { ImageWithFallback } from './ImageWithFallback'

interface VenueCardProps {
  venue: Venue
  /** When used alongside map, highlight if this venue is selected */
  selected?: boolean
}

export function VenueCard({ venue, selected }: VenueCardProps) {
  return (
    <Link
      to={`/venue/${venue.id}`}
      className={`block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 border-2 ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
      }`}
    >
      <div className="h-40 overflow-hidden">
        <ImageWithFallback
          src={venue.image}
          alt={venue.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-slate-900 font-medium mb-1.5 line-clamp-2">{venue.name}</h3>
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span>{venue.suburb}</span>
        </div>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{venue.address}</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {venue.surfaceTypes.map((s, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-2 text-xs text-gray-600">
          {venue.indoor && (
            <span className="flex items-center">
              <Moon className="w-3.5 h-3.5 mr-0.5" /> Indoor
            </span>
          )}
          {venue.outdoor && (
            <span className="flex items-center">
              <Sun className="w-3.5 h-3.5 mr-0.5" /> Outdoor
            </span>
          )}
          {venue.nightLighting && (
            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
              Night lights
            </span>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span className="line-clamp-1">{venue.openingHours}</span>
        </div>
        <p className="text-sm font-medium text-slate-700 mt-1">{venue.priceRange}</p>
      </div>
    </Link>
  )
}
