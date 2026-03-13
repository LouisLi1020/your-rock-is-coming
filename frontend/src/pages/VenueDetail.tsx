import { Link, useParams } from 'react-router-dom'
import { MapPin, Clock, Phone, Sun, Moon, ExternalLink } from 'lucide-react'
import { getVenueById } from '../data/venues'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { Nav } from '../components/Nav'

export function VenueDetail() {
  const { venueId } = useParams<{ venueId: string }>()
  const venue = venueId ? getVenueById(venueId) : undefined

  if (!venue) {
    return (
      <div className="min-h-screen bg-sand flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-bark-lt">Venue not found.</p>
          <Link to="/" className="mt-4 inline-block text-g600 font-medium hover:underline">
            ← Back to venues
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <nav className="bg-white border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 text-sm text-bark-lt">
          <Link to="/" className="text-g600 hover:underline">Venues</Link>
          <span className="mx-2">/</span>
          <span className="text-bark">{venue.name}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-[20px] overflow-hidden border border-[var(--border)]">
          <div className="h-56 sm:h-72 overflow-hidden">
            <ImageWithFallback
              src={venue.image}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="font-lora text-2xl font-semibold text-bark mb-2">{venue.name}</h1>
            <p className="text-bark-lt flex items-center">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              {venue.suburb} · {venue.address}
            </p>

            <div className="flex flex-wrap gap-2 my-4">
              {venue.surfaceTypes.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-g50 text-g800 text-sm rounded-full"
                >
                  {s}
                </span>
              ))}
              {venue.indoor && (
                <span className="flex items-center px-3 py-1 bg-g50 text-g800 text-sm rounded-full">
                  <Moon className="w-4 h-4 mr-1" /> Indoor
                </span>
              )}
              {venue.outdoor && (
                <span className="flex items-center px-3 py-1 bg-t50 text-t600 text-sm rounded-full">
                  <Sun className="w-4 h-4 mr-1" /> Outdoor
                </span>
              )}
              {venue.nightLighting && (
                <span className="px-3 py-1 bg-a50 text-a400 text-sm rounded-full">
                  Night lights
                </span>
              )}
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex items-start">
                <Clock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-bark-lt" />
                <div>
                  <dt className="text-bark-lt">Opening hours</dt>
                  <dd className="text-bark">{venue.openingHours}</dd>
                </div>
              </div>
              <div>
                <dt className="text-bark-lt">Price</dt>
                <dd className="text-bark font-medium">{venue.priceRange}</dd>
              </div>
              {venue.contact && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-bark-lt" />
                  <dd className="text-bark">
                    <a href={`tel:${venue.contact}`} className="hover:underline text-g600">
                      {venue.contact}
                    </a>
                  </dd>
                </div>
              )}
              {venue.amenities?.length ? (
                <div>
                  <dt className="text-bark-lt">Amenities</dt>
                  <dd className="text-bark">{venue.amenities.join(', ')}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to={`/venue/${venue.id}/book`}
                className="inline-flex items-center justify-center px-6 py-3 bg-g600 text-white font-semibold rounded-xl hover:bg-g800 transition-colors"
              >
                Book a court
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center justify-center px-6 py-3 border border-[var(--border)] text-bark font-medium rounded-xl hover:bg-g50"
              >
                Book by calendar
              </Link>
              {venue.website && (
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-6 py-3 border border-[var(--border)] text-bark font-medium rounded-xl hover:bg-g50 transition-colors"
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
