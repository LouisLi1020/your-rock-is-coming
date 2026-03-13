import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Nav } from '../components/Nav'
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
      <div className="min-h-screen bg-sand flex flex-col">
        <Nav />
        <div className="flex-1 py-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="font-lora text-2xl font-semibold text-bark mb-6">Booking confirmed</h1>
            <div className="bg-white rounded-[20px] border border-[var(--border)] p-6 text-left">
              <p className="font-semibold text-bark">{venue.name}</p>
              <p className="text-bark-lt mt-1">
                {formatDateDisplay(dateObj)} · {selectedSlot.start}–{selectedSlot.end}
              </p>
              <p className="text-sm text-bark-lt mt-1">{selectedSlot.courtId}</p>
              <p className="text-sm text-bark-lt mt-4">
                A confirmation has been sent to your email (demo). Payment can be collected at the venue or via link.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to={`/venue/${venue.id}`} className="px-5 py-2.5 border border-[var(--border)] rounded-xl text-bark font-medium hover:bg-g50">
                Back to venue
              </Link>
              <Link to="/" className="px-5 py-2.5 bg-g600 text-white font-semibold rounded-xl hover:bg-g800">
                Find another court
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <nav className="bg-white border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 text-sm text-bark-lt">
          <Link to="/" className="text-g600 hover:underline">Venues</Link>
          <span className="mx-2">/</span>
          <Link to={`/venue/${venue.id}`} className="text-g600 hover:underline">
            {venue.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-bark">Book</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex-1">
        <h1 className="font-lora text-2xl font-semibold text-bark mb-1">
          Book a court — {venue.name}
        </h1>
        <p className="text-bark-lt mb-8">{venue.priceRange}</p>

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
                      ? 'border-g600 bg-g600 text-white'
                      : 'border-[var(--border)] bg-white text-bark hover:bg-g50'
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
              className="px-6 py-3 bg-g600 text-white font-semibold rounded-xl hover:bg-g800"
            >
              Confirm booking
            </button>
          </div>
        )}

        <Link
          to={`/venue/${venue.id}`}
          className="text-sm text-bark-lt hover:text-g600"
        >
          ← Back to venue
        </Link>
      </div>
    </div>
  )
}
