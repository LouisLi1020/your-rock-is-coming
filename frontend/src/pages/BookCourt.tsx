import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { getVenueById } from '../data/venues'
import { getTimeSlotsForDate, type TimeSlot } from '../data/booking'

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function BookCourt() {
  const { venueId } = useParams<{ venueId: string }>()
  const [searchParams] = useSearchParams()
  const initialDate = searchParams.get('date') || formatDateInput(new Date())

  const venue = venueId ? getVenueById(venueId) : undefined
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [confirmed, setConfirmed] = useState(false)

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

  const dateObj = new Date(selectedDate + 'T12:00:00')
  const courtCount = Math.min(venue.courts ?? 2, 4)
  const slots = getTimeSlotsForDate(
    venue.id,
    dateObj,
    courtCount,
    venue.openingHours
  )
  const availableSlots = slots.filter((s) => s.available)

  const handleConfirm = () => {
    if (selectedSlot) setConfirmed(true)
  }

  if (confirmed && selectedSlot) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-medium text-slate-900 mb-6">
            Booking confirmed
          </h1>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-left">
            <p className="font-medium text-slate-900">{venue.name}</p>
            <p className="text-gray-600 mt-1">
              {formatDateDisplay(dateObj)} · {selectedSlot.start} – {selectedSlot.end}
            </p>
            <p className="text-sm text-gray-500 mt-1">{selectedSlot.courtId}</p>
            <p className="text-sm text-gray-500 mt-4">
              A confirmation has been sent to your email (demo). Payment can be
              collected at the venue or via link.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={`/venue/${venue.id}`}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Back to venue
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:opacity-90"
            >
              Find another court
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 text-sm text-gray-600">
          <Link to="/" className="text-primary hover:underline">Venues</Link>
          <span className="mx-2">/</span>
          <Link to={`/venue/${venue.id}`} className="text-primary hover:underline">
            {venue.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Book</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-medium text-slate-900 mb-1">
          Book a court — {venue.name}
        </h1>
        <p className="text-gray-600 mb-8">{venue.priceRange}</p>

        <section className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            min={formatDateInput(new Date())}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setSelectedSlot(null)
            }}
            className="w-full max-w-xs px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-medium text-slate-900 mb-2">
            Available times — {formatDateDisplay(dateObj)}
          </h2>
          {availableSlots.length === 0 ? (
            <p className="text-gray-500">No slots available on this day. Try another date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSlot?.id === slot.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {slot.start} – {slot.end} · {slot.courtId}
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedSlot && (
          <div className="mb-8">
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:opacity-90"
            >
              Confirm booking
            </button>
          </div>
        )}

        <Link
          to={`/venue/${venue.id}`}
          className="text-sm text-gray-600 hover:text-primary"
        >
          ← Back to venue
        </Link>
      </div>
    </div>
  )
}
