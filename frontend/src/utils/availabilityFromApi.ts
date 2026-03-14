/**
 * Convert backend availability grid to frontend TimeSlot[] for reuse in VenueDetail, CalendarBookPage, QuickBookModal.
 */
import type { AvailabilityGrid } from '../api/courts'
import type { TimeSlot } from '../data/booking'

export function availabilityGridToSlots(av: AvailabilityGrid, dateStr: string): TimeSlot[] {
  const slots: TimeSlot[] = []
  let id = 0
  for (let courtNum = 1; courtNum <= av.courts_count; courtNum++) {
    const courtId = `court-${courtNum}`
    const hourGrid = av.grid[courtNum] ?? {}
    for (let h = av.open_hour; h < av.close_hour; h++) {
      const start = `${String(h).padStart(2, '0')}:00`
      const end = `${String(h + 1).padStart(2, '0')}:00`
      const available = hourGrid[h] === 'available'
      slots.push({
        id: `slot-${dateStr}-${start}-${courtId}-${id++}`,
        start,
        end,
        courtId,
        available,
      })
    }
  }
  return slots
}
