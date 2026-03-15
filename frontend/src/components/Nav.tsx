import { Link, NavLink } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { useBooking } from '../context/BookingContext'

export function Nav() {
  const { setBookingsPanelOpen } = useBooking()
  return (
    <nav className="sticky top-0 z-[900] flex items-center justify-between h-14 px-4 sm:px-6 bg-white border-b border-[var(--border)]">
      <Link to="/" className="font-lora text-base font-semibold text-g600 tracking-tight">
        your<span className="text-g400">·</span>rock<span className="text-g400">·</span>is<span className="text-g400">·</span>coming
      </Link>
      <div className="flex items-center gap-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-[20px] text-xs font-medium transition-colors ${
              isActive ? 'bg-g50 text-g800' : 'text-bark-lt hover:bg-g50 hover:text-g800'
            }`
          }
        >
          Discover
        </NavLink>
        <NavLink
          to="/book"
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-[20px] text-xs font-medium transition-colors ${
              isActive ? 'bg-g50 text-g800' : 'text-bark-lt hover:bg-g50 hover:text-g800'
            }`
          }
        >
          Book
        </NavLink>
        <NavLink
          to="/bookings"
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-[20px] text-xs font-medium transition-colors ${
              isActive ? 'bg-g50 text-g800' : 'text-bark-lt hover:bg-g50 hover:text-g800'
            }`
          }
        >
          Schedule
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-[20px] text-xs font-medium transition-colors ${
              isActive ? 'bg-g50 text-g800' : 'text-bark-lt hover:bg-g50 hover:text-g800'
            }`
          }
        >
          Profile
        </NavLink>
      </div>
      <button
        type="button"
        onClick={() => setBookingsPanelOpen(true)}
        title="My schedule"
        className="w-10 h-10 rounded-full bg-white border-2 border-[var(--accent)] flex items-center justify-center text-g600 shadow-sm hover:scale-[1.05] hover:shadow-md hover:border-g600 transition-all"
      >
        <Calendar className="w-5 h-5" strokeWidth={2} aria-hidden />
      </button>
    </nav>
  )
}