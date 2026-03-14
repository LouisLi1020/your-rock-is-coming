// src/context/BookingContext.tsx — 替换 frontend/src/context/BookingContext.tsx
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { getBookings, createBooking, cancelBooking, refundBooking } from '../api/bookings'
import type { Booking, CreateBookingPayload } from '../api/bookings'

// ═══ Mock 用户（demo 模式自动登录）═══
export const DEMO_USER = {
  name: 'Alex Demo',
  email: 'demo@courtfinder.com',
  phone: '0400000000',
} as const

type BookingContextValue = {
  bookings: Booking[]
  loading: boolean
  /** Refresh bookings from API */
  refresh: () => Promise<void>
  /** Create a booking via API */
  addBooking: (data: CreateBookingPayload) => Promise<{ success: boolean; error?: string }>
  /** Cancel a booking via API */
  removeBooking: (id: number) => Promise<void>
  /** Weather refund via API */
  requestRefund: (id: number) => Promise<{ success: boolean; refund_amount?: number; error?: string }>
  /** Current user email */
  userEmail: string
  /** My Bookings slide panel (right side, like index) */
  bookingsPanelOpen: boolean
  setBookingsPanelOpen: (open: boolean) => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingsPanelOpen, setBookingsPanelOpen] = useState(false)
  const userEmail = DEMO_USER.email

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBookings(userEmail)
      if (res.success) setBookings(res.bookings)
    } catch (e) {
      console.error('Failed to load bookings', e)
    } finally {
      setLoading(false)
    }
  }, [userEmail])

  // Load bookings on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  const addBooking = useCallback(async (data: CreateBookingPayload) => {
    try {
      const res = await createBooking(data)
      if (res.success) {
        await refresh()
        return { success: true }
      }
      return { success: false, error: res.error || 'Booking failed' }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' }
    }
  }, [refresh])

  const removeBooking = useCallback(async (id: number) => {
    try {
      await cancelBooking(id, userEmail)
      await refresh()
    } catch (e) {
      console.error('Cancel failed', e)
    }
  }, [userEmail, refresh])

  const requestRefund = useCallback(async (id: number) => {
    try {
      const res = await refundBooking(id, userEmail)
      if (res.success) {
        await refresh()
        return { success: true, refund_amount: res.refund_amount }
      }
      return { success: false, error: res.error }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }, [userEmail, refresh])

  return (
    <BookingContext.Provider
      value={{ bookings, loading, refresh, addBooking, removeBooking, requestRefund, userEmail, bookingsPanelOpen, setBookingsPanelOpen }}
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
