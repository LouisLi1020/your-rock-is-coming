import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useBooking } from '../context/BookingContext'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { guestEmail, setGuestEmail, bookings } = useBooking()
  const [email, setEmail] = useState(guestEmail ?? '')

  const handleSave = () => {
    setGuestEmail(email.trim() || null)
    toast.success('Profile updated')
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <div className="max-w-[500px] mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="font-lora text-2xl font-semibold text-bark mb-6">Profile</h1>
        <div className="bg-white rounded-[20px] border border-[var(--border)] p-6 space-y-4">
          <p className="text-sm text-bark-lt">
            Optional: save your email for booking confirmations and receipts.
          </p>
          <label className="block">
            <span className="text-xs font-medium text-bark-lt block mb-1">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm focus:ring-2 focus:ring-g200 focus:border-g200 outline-none"
            />
          </label>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-g600 text-white rounded-xl text-sm font-semibold hover:bg-g800"
          >
            Save
          </button>
        </div>
        <p className="text-sm text-bark-lt mt-6">
          You have {bookings.length} upcoming booking{bookings.length !== 1 ? 's' : ''}.{' '}
          <Link to="/bookings" className="text-g600 font-medium hover:underline">View bookings →</Link>
        </p>
      </div>
    </div>
  )
}