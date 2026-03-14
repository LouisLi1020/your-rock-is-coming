// src/App.tsx — 替换 frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { BookingProvider, useBooking } from './context/BookingContext'
import { BookingsSlidePanel } from './components/home'
import { MapPage } from './pages/MapPage'
import { Home } from './pages/Home'
import { BookingsPage } from './pages/BookingsPage'
import { CalendarBookPage } from './pages/CalendarBookPage'
import { VenueDetail } from './pages/VenueDetail'
import { ProfilePage } from './pages/ProfilePage'

function RedirectToCalendarBook() {
  const { venueId } = useParams<{ venueId: string }>()
  return <Navigate to={venueId ? `/book?venue=${venueId}` : '/book'} replace />
}

function AppRoutes() {
  const { bookingsPanelOpen, setBookingsPanelOpen } = useBooking()
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/book" element={<CalendarBookPage />} />
        <Route path="/venue/:venueId" element={<VenueDetail />} />
        <Route path="/venue/:venueId/book" element={<RedirectToCalendarBook />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <BookingsSlidePanel open={bookingsPanelOpen} onClose={() => setBookingsPanelOpen(false)} />
    </>
  )
}

export function App() {
  return (
    <BookingProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-center" toastOptions={{ className: 'toast-custom' }} />
      </BrowserRouter>
    </BookingProvider>
  )
}
