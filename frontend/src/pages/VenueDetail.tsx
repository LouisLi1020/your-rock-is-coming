import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  MapPin,
  Clock,
  Phone,
  Sun,
  Moon,
  ExternalLink,
  Calendar,
  ArrowLeft,
  Wifi,
  Droplet,
  Car,
  Users,
} from 'lucide-react'
import { getVenueById } from '../data/venues'
import { getTimeSlotsForDate, formatCourtLabel } from '../data/booking'
import { useBooking } from '../context/BookingContext'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { Nav } from '../components/Nav'

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  parking: Car,
  toilets: Users,
  water: Droplet,
  'pro shop': ExternalLink,
}
const AMENITY_FALLBACK = Users

export function VenueDetail() {
  const { venueId } = useParams<{ venueId: string }>()
  const venue = venueId ? getVenueById(venueId) : undefined
  const { bookings } = useBooking()
  const courtCount = Math.min(venue?.courts ?? 2, 4)
  const today = new Date()
  const todaySlots =
    venue && courtCount
      ? getTimeSlotsForDate(venue.id, today, courtCount, venue.openingHours, bookings)
      : []

  if (!venue) {
    return (
      <div className="min-h-screen bg-sand flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-bark-lt">Venue not found.</p>
          <Link to="/" className="mt-4 inline-block text-g600 font-medium hover:underline flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to venues
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />

      {/* Header */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-g600 hover:text-g800 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all venues
          </Link>
        </div>
      </div>

      {/* Hero with overlay */}
      <div className="relative h-80 sm:h-96 overflow-hidden">
        <ImageWithFallback
          src={venue.image}
          alt={venue.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-white text-2xl sm:text-3xl font-lora font-semibold mb-2">{venue.name}</h1>
            <div className="flex items-center text-white/95 text-base sm:text-lg">
              <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{venue.suburb}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Information */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
              <h2 className="text-bark font-lora font-semibold text-lg mb-4">Venue Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 mt-0.5 text-bark-lt flex-shrink-0" />
                  <p className="text-bark">{venue.address}</p>
                </div>
                <div className="flex items-start">
                  <Clock className="w-5 h-5 mr-3 mt-0.5 text-bark-lt flex-shrink-0" />
                  <p className="text-bark">{venue.openingHours}</p>
                </div>
                {venue.contact && (
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 mr-3 mt-0.5 text-bark-lt flex-shrink-0" />
                    <a href={`tel:${venue.contact}`} className="text-g600 hover:text-g800">
                      {venue.contact}
                    </a>
                  </div>
                )}
                {venue.website && (
                  <div className="flex items-start">
                    <ExternalLink className="w-5 h-5 mr-3 mt-0.5 text-bark-lt flex-shrink-0" />
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-g600 hover:text-g800"
                    >
                      Visit official website
                    </a>
                  </div>
                )}
                <div className="flex items-start">
                  <span className="w-5 h-5 mr-3 mt-0.5 flex items-center justify-center text-bark-lt flex-shrink-0 font-semibold text-sm">$</span>
                  <p className="text-bark">{venue.priceRange}</p>
                </div>
              </div>
            </section>

            {/* Court Details */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
              <h2 className="text-bark font-lora font-semibold text-lg mb-4">Court Details</h2>
              <div className="mb-6">
                <h3 className="text-bark-lt text-sm font-medium mb-3">Surface types</h3>
                <div className="flex flex-wrap gap-2">
                  {venue.surfaceTypes.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-g50 text-g800 text-sm font-medium rounded-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`flex items-center p-4 rounded-xl ${venue.indoor ? 'bg-g50' : 'bg-gray-100'}`}>
                  <Moon className={`w-6 h-6 mr-3 flex-shrink-0 ${venue.indoor ? 'text-g600' : 'text-gray-400'}`} />
                  <span className={venue.indoor ? 'text-bark' : 'text-gray-500'}>
                    {venue.indoor ? 'Indoor courts available' : 'No indoor courts'}
                  </span>
                </div>
                <div className={`flex items-center p-4 rounded-xl ${venue.outdoor ? 'bg-t50' : 'bg-gray-100'}`}>
                  <Sun className={`w-6 h-6 mr-3 flex-shrink-0 ${venue.outdoor ? 'text-t600' : 'text-gray-400'}`} />
                  <span className={venue.outdoor ? 'text-bark' : 'text-gray-500'}>
                    {venue.outdoor ? 'Outdoor courts available' : 'No outdoor courts'}
                  </span>
                </div>
                <div className={`flex items-center p-4 rounded-xl sm:col-span-2 ${venue.nightLighting ? 'bg-a50/50' : 'bg-gray-100'}`}>
                  <Calendar className={`w-6 h-6 mr-3 flex-shrink-0 ${venue.nightLighting ? 'text-a400' : 'text-gray-400'}`} />
                  <span className={venue.nightLighting ? 'text-bark' : 'text-gray-500'}>
                    {venue.nightLighting ? 'Night lighting available' : 'No night lighting'}
                  </span>
                </div>
              </div>
            </section>

            {/* Facilities & Amenities */}
            {(venue.amenities?.length ?? 0) > 0 && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                <h2 className="text-bark font-lora font-semibold text-lg mb-4">Facilities & amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {venue.amenities!.map((a, i) => {
                    const key = a.toLowerCase().replace(/\s+/g, '')
                    const Icon = AMENITY_ICONS[key] ?? AMENITY_FALLBACK
                    return (
                      <div key={i} className="flex items-center text-bark">
                        <Icon className="w-5 h-5 mr-2 text-g600 flex-shrink-0" />
                        <span className="text-sm">{a}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* About */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
              <h2 className="text-bark font-lora font-semibold text-lg mb-4">About this venue</h2>
              <p className="text-bark-lt leading-relaxed">
                {venue.name} is a tennis venue in {venue.suburb}
                {venue.surface ? ` with ${venue.surface}.` : '.'} It offers quality courts and facilities for players of all levels.
              </p>
            </section>
          </div>

          {/* Sidebar: Today's Availability */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)] sticky top-4">
              <h2 className="text-bark font-lora font-semibold text-lg mb-1">Today&apos;s availability</h2>
              <p className="text-sm text-bark-lt mb-4">{format(today, 'EEEE, MMMM d, yyyy')}</p>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {todaySlots.length === 0 ? (
                  <p className="text-sm text-bark-lt">No slots today. Try another day.</p>
                ) : (
                  todaySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-lg border ${
                        slot.available
                          ? 'border-green-200 bg-green-50/80'
                          : 'border-[var(--border)] bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${slot.available ? 'text-bark' : 'text-gray-400'}`}>
                          {slot.start}–{slot.end} · {formatCourtLabel(slot.courtId)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium flex-shrink-0 ${
                            slot.available ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {slot.available ? 'Available' : 'Booked'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link
                to={`/book?venue=${venue.id}`}
                className="mt-6 w-full inline-flex items-center justify-center px-4 py-3 bg-g600 text-white rounded-xl font-semibold hover:bg-g800 transition-colors"
              >
                Book a court
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
