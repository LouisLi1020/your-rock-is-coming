import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useBooking } from '../context/BookingContext'
import { format, parseISO } from 'date-fns'

export function BookingsPage() {
  const { bookings, removeBooking } = useBooking()

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <div className="max-w-[900px] mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="font-lora text-2xl font-semibold text-bark mb-2">My bookings</h1>
        <p className="text-sm text-bark-lt mb-6">Your upcoming court bookings. Rain-aware refund available for outdoor courts.</p>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[var(--border)] p-12 text-center">
            <p className="text-bark-lt mb-4">No bookings yet.</p>
            <Link to="/" className="text-g600 font-medium hover:underline">Discover venues →</Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="bg-white rounded-[16px] border border-[var(--border)] p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-bark">{b.venueName}</p>
                  <p className="text-sm text-bark-lt">
                    {format(parseISO(b.date), 'EEE d MMM yyyy')} · {b.start}–{b.end} · {b.courtId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/venue/${b.venueId}`}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--border)] hover:bg-g50"
                  >
                    View venue
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeBooking(b.id)}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}