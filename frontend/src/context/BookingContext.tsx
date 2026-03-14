import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Venue } from '../data/venues'
import type { TimeSlot } from '../data/booking'

export type BookingRecord = {
  id: string
  venueId: string
  venueName: string
  date: string
  start: string
  end: string
  courtId: string
  createdAt: number
}

type BookingContextValue = {
  bookings: BookingRecord[]
  /** Add a booking. Use endOverride for multi-hour (e.g. 2h: endOverride = "09:00" when slot.start is "07:00"). */
  addBooking: (venue: Venue, date: Date, slot: TimeSlot, endOverride?: string) => void
  removeBooking: (id: string) => void
  /** Guest profile for one-click book (optional) */
  guestEmail: string | null
  setGuestEmail: (email: string | null) => void
}

const STORAGE_KEY = 'yrbc-bookings'
const EMAIL_KEY = 'yrbc-guest-email'

function loadBookings(): BookingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BookingRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveBookings(list: BookingRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingRecord[]>(loadBookings)
  const [guestEmail, setGuestEmailState] = useState<string | null>(() =>
    localStorage.getItem(EMAIL_KEY)
  )

  const setGuestEmail = useCallback((email: string | null) => {
    setGuestEmailState(email)
    if (email) localStorage.setItem(EMAIL_KEY, email)
    else localStorage.removeItem(EMAIL_KEY)
  }, [])

  const addBooking = useCallback((venue: Venue, date: Date, slot: TimeSlot, endOverride?: string) => {
    const record: BookingRecord = {
      id: `book-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      venueId: venue.id,
      venueName: venue.name,
      date: date.toISOString().slice(0, 10),
      start: slot.start,
      end: endOverride ?? slot.end,
      courtId: slot.courtId,
      createdAt: Date.now(),
    }
    setBookings((prev) => {
      const next = [...prev, record]
      saveBookings(next)
      return next
    })
  }, [])

  const removeBooking = useCallback((id: string) => {
    setBookings((prev) => {
      const next = prev.filter((b) => b.id !== id)
      saveBookings(next)
      return next
    })
  }, [])

  return (
    <BookingContext.Provider
      value={{
        bookings,
        addBooking,
        removeBooking,
        guestEmail,
        setGuestEmail,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
