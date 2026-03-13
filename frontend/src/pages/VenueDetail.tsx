import { Link, useParams } from 'react-router-dom'
import { MapPin, Clock, Phone, Sun, Moon, ExternalLink } from 'lucide-react'
import { getVenueById } from '../data/venues'
import { ImageWithFallback } from '../components/ImageWithFallback'

export function VenueDetail() {
  const { venueId } = useParams<{ venueId: string }>()
  const venue = venueId ? getVenueById(venueId) : undefined

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Venue not found.</p>
          <Link to="/" className="mt-4 inline-block text-primary font-medium hover:underline">
            ← Back to venues
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 text-sm text-gray-600">
          <Link to="/" className="text-primary hover:underline">Venues</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{venue.name}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="h-56 sm:h-72 overflow-hidden">
            <ImageWithFallback
              src={venue.image}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-medium text-slate-900 mb-2">{venue.name}</h1>
            <p className="text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              {venue.suburb} · {venue.address}
            </p>

            <div className="flex flex-wrap gap-2 my-4">
              {venue.surfaceTypes.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                >
                  {s}
                </span>
              ))}
              {venue.indoor && (
                <span className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  <Moon className="w-4 h-4 mr-1" /> Indoor
                </span>
              )}
              {venue.outdoor && (
                <span className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  <Sun className="w-4 h-4 mr-1" /> Outdoor
                </span>
              )}
              {venue.nightLighting && (
                <span className="px-3 py-1 bg-amber-50 text-amber-800 text-sm rounded-full">
                  Night lights
                </span>
              )}
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex items-start">
                <Clock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
                <div>
                  <dt className="text-gray-500">Opening hours</dt>
                  <dd className="text-gray-900">{venue.openingHours}</dd>
                </div>
              </div>
              <div>
                <dt className="text-gray-500">Price</dt>
                <dd className="text-gray-900 font-medium">{venue.priceRange}</dd>
              </div>
              {venue.contact && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                  <dd className="text-gray-900">
                    <a href={`tel:${venue.contact}`} className="hover:underline">
                      {venue.contact}
                    </a>
                  </dd>
                </div>
              )}
              {venue.amenities?.length ? (
                <div>
                  <dt className="text-gray-500">Amenities</dt>
                  <dd className="text-gray-900">{venue.amenities.join(', ')}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to={`/venue/${venue.id}/book`}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Book a court
              </Link>
              {venue.website && (
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
