/**
 * Generate available time slots for a venue on a given date.
 * MVP: mock availability (e.g. hourly slots 7–20, some randomly "taken" for demo).
 */

export type TimeSlot = {
  id: string
  start: string // "09:00"
  end: string   // "10:00"
  courtId: string
  available: boolean
}

function parseHours(s: string): { open: number; close: number } {
  // "Mon–Sun · 7:00am – 8:00pm" -> { open: 7, close: 20 }
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

export function getTimeSlotsForDate(
  _venueId: string,
  date: Date,
  courtCount: number,
  openingHours: string,
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const { open, close } = parseHours(openingHours)
  const dateStr = date.toISOString().slice(0, 10)
  let id = 0
  for (let hour = open; hour < close; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`
    for (let c = 1; c <= courtCount; c++) {
      const courtId = `court-${c}`
      // Mock: ~70% slots available (deterministic by date + hour + court)
      const seed = (date.getTime() + hour * 60 + c) % 10
      slots.push({
        id: `slot-${dateStr}-${start}-${courtId}-${id++}`,
        start,
        end,
        courtId,
        available: seed < 7,
      })
    }
  }
  return slots
}
