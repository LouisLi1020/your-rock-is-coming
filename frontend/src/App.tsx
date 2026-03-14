import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { BookingProvider } from './context/BookingContext'
import { Home } from './pages/Home'

function RedirectToCalendarBook() {
  const { venueId } = useParams<{ venueId: string }>()
  return <Navigate to={venueId ? `/book?venue=${venueId}` : '/book'} replace />
}
import { MapPage } from './pages/MapPage'
import { BookingsPage } from './pages/BookingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { CalendarBookPage } from './pages/CalendarBookPage'
import { VenueDetail } from './pages/VenueDetail'

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
          <Route path="/venue/:venueId/book" element={<RedirectToCalendarBook />} />
        </Routes>
        <Toaster position="top-center" toastOptions={{ className: 'toast-custom' }} />
      </BrowserRouter>
    </BookingProvider>
  )
}
