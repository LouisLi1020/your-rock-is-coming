/**
 * Single source of truth for availability and booking logic.
 * Slots respect existing bookings (from BookingContext) so all flows behave consistently.
 */

import type { BookingRecord } from '../context/BookingContext'

export const MAX_BOOKING_HOURS = 2

export type TimeSlot = {
  id: string
  start: string
  end: string
  courtId: string
  available: boolean
}

/** Display court-1 → "Court 1" everywhere for consistency */
export function formatCourtLabel(courtId: string): string {
  const n = courtId.replace(/^court-/i, '')
  return `Court ${n}`
}

function parseHours(s: string): { open: number; close: number } {
  const match = s.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?.*?(\d{1,2}):?(\d{2})?\s*(am|pm)/i)
  if (!match) return { open: 7, close: 20 }
  const toMins = (h: number, m: number, ampm: string) => {
    if (ampm?.toLowerCase() === 'pm' && h !== 12) h += 12
    if (ampm?.toLowerCase() === 'am' && h === 12) h = 0
    return h * 60 + (m || 0)
  }
  const openMins = toMins(parseInt(match[1], 10), parseInt(match[2] || '0', 10), match[3] || 'am')
  const closeMins = toMins(parseInt(match[4], 10), parseInt(match[5] || '0', 10), match[6] || 'pm')
  return {
    open: Math.floor(openMins / 60),
    close: Math.floor(closeMins / 60),
  }
}

/** Check if a booking overlaps the time range [slotStart, slotEnd) for same venue/date/court */
function bookingOverlaps(
  b: BookingRecord,
  venueId: string,
  dateStr: string,
  courtId: string,
  slotStart: string,
  slotEnd: string
): boolean {
  if (b.venueId !== venueId || b.date !== dateStr || b.courtId !== courtId) return false
  const [sH, sM] = slotStart.split(':').map(Number)
  const [eH, eM] = slotEnd.split(':').map(Number)
  const [bStartH, bStartM] = b.start.split(':').map(Number)
  const [bEndH, bEndM] = b.end.split(':').map(Number)
  const slotStartMins = sH * 60 + sM
  const slotEndMins = eH * 60 + eM
  const bStartMins = bStartH * 60 + bStartM
  const bEndMins = bEndH * 60 + bEndM
  return slotStartMins < bEndMins && slotEndMins > bStartMins
}

/**
 * Generate time slots for a venue on a date.
 * When existingBookings is provided, slots that overlap any booking are marked unavailable.
 * Mock base availability: ~70% of slots are "free" (deterministic seed); then we overlay real bookings.
 */
export function getTimeSlotsForDate(
  venueId: string,
  date: Date,
  courtCount: number,
  openingHours: string,
  existingBookings: BookingRecord[] = []
): TimeSlot[] {
  const dateStr = date.toISOString().slice(0, 10)
  const { open, close } = parseHours(openingHours)
  const slots: TimeSlot[] = []
  let id = 0
  for (let hour = open; hour < close; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`
    for (let c = 1; c <= courtCount; c++) {
      const courtId = `court-${c}`
      const seed = (date.getTime() + hour * 60 + c) % 10
      const mockAvailable = seed < 7
      const takenByBooking = existingBookings.some((b) =>
        bookingOverlaps(b, venueId, dateStr, courtId, start, end)
      )
      slots.push({
        id: `slot-${dateStr}-${start}-${courtId}-${id++}`,
        start,
        end,
        courtId,
        available: mockAvailable && !takenByBooking,
      })
    }
  }
  return slots
}

/** For multi-hour: check that every 1h segment in [start, end) is available for the same court */
export function isRangeAvailable(
  venueId: string,
  date: Date,
  courtId: string,
  start: string,
  endHours: number,
  allSlots: TimeSlot[]
): boolean {
  const [startH] = start.split(':').map(Number)
  for (let h = 0; h < endHours; h++) {
    const hStart = `${(startH + h).toString().padStart(2, '0')}:00`
    const hEnd = `${(startH + h + 1).toString().padStart(2, '0')}:00`
    const slot = allSlots.find(
      (s) => s.courtId === courtId && s.start === hStart
    )
    if (!slot || !slot.available) return false
  }
  return true
}

/** Compute end time string for start + durationHours (e.g. "07:00" + 2 => "09:00") */
export function addHoursToTime(start: string, durationHours: number): string {
  const [h, m] = start.split(':').map(Number)
  const newH = h + durationHours
  return `${newH.toString().padStart(2, '0')}:00`
}
