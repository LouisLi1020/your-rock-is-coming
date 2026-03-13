import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { VenueDetail } from './pages/VenueDetail'
import { BookCourt } from './pages/BookCourt'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/venue/:venueId" element={<VenueDetail />} />
        <Route path="/venue/:venueId/book" element={<BookCourt />} />
      </Routes>
    </BrowserRouter>
  )
}
