import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { BookingProvider } from './context/BookingContext'
import { Home } from './pages/Home'
import { MapPage } from './pages/MapPage'
import { BookingsPage } from './pages/BookingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { CalendarBookPage } from './pages/CalendarBookPage'
import { VenueDetail } from './pages/VenueDetail'
import { BookCourt } from './pages/BookCourt'

export function App() {
  return (
    <BookingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/book" element={<CalendarBookPage />} />
          <Route path="/venue/:venueId" element={<VenueDetail />} />
          <Route path="/venue/:venueId/book" element={<BookCourt />} />
        </Routes>
        <Toaster position="top-center" toastOptions={{ className: 'toast-custom' }} />
      </BrowserRouter>
    </BookingProvider>
  )
}
