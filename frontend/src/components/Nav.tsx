import { Link, NavLink } from 'react-router-dom'

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 sm:px-6 bg-white border-b border-[var(--border)]">
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
          to="/map"
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-[20px] text-xs font-medium transition-colors ${
              isActive ? 'bg-g50 text-g800' : 'text-bark-lt hover:bg-g50 hover:text-g800'
            }`
          }
        >
          Map
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
          Bookings
        </NavLink>
      </div>
      <Link
        to="/profile"
        className="bg-g600 text-white border-none px-4 py-2 rounded-[20px] text-xs font-medium hover:bg-g800 transition-colors"
      >
        Profile
      </Link>
    </nav>
  )
}
