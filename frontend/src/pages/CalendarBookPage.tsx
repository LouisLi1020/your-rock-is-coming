import { useState, useEffect } from 'react'
import { Nav } from '../components/Nav'
import { Link, useSearchParams } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from 'date-fns'
import { getTimeSlotsForDate, formatCourtLabel, isRangeAvailable, addHoursToTime, MAX_BOOKING_HOURS } from '../data/booking'
import { fetchSydneyWeather, weatherEmoji } from '../data/weather'
import { venues } from '../data/venues'
import { getVenueById } from '../data/venues'
import { useBooking } from '../context/BookingContext'
import toast from 'react-hot-toast'
import type { TimeSlot } from '../data/booking'

export function CalendarBookPage() {
  const [searchParams] = useSearchParams()
  const venueFromUrl = searchParams.get('venue')
  const [month, setMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [venueId, setVenueId] = useState<string>(venues[0]?.id ?? '')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [durationHours, setDurationHours] = useState<1 | 2>(1)
  const [weather, setWeather] = useState<Awaited<ReturnType<typeof fetchSydneyWeather>> | null>(null)
  const { bookings, addBooking } = useBooking()

  useEffect(() => {
    if (venueFromUrl && getVenueById(venueFromUrl)) setVenueId(venueFromUrl)
  }, [venueFromUrl])

  const venue = venueId ? getVenueById(venueId) : undefined
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const courtCount = Math.min(venue?.courts ?? 2, 4)
  const slots = selectedDate && venue
    ? getTimeSlotsForDate(venue.id, selectedDate, courtCount, venue.openingHours, bookings)
    : []
  const availableSlots = slots.filter((s) => s.available)
  const slotsForDuration = durationHours === 2 && selectedDate && venue
    ? availableSlots.filter((s) => isRangeAvailable(venue.id, selectedDate, s.courtId, s.start, 2, slots))
    : availableSlots

  useEffect(() => {
    fetchSydneyWeather().then(setWeather).catch(() => setWeather(null))
  }, [])

  const handleConfirm = () => {
    if (!venue || !selectedDate || !selectedSlot) return
    const endTime = durationHours === 2 ? addHoursToTime(selectedSlot.start, 2) : selectedSlot.end
    const freshSlots = getTimeSlotsForDate(venue.id, selectedDate, courtCount, venue.openingHours, bookings)
    const stillAvailable = durationHours === 2
      ? isRangeAvailable(venue.id, selectedDate, selectedSlot.courtId, selectedSlot.start, 2, freshSlots)
      : freshSlots.some((s) => s.id === selectedSlot.id && s.available)
    if (!stillAvailable) {
      toast.error('This slot was just taken. Please pick another.')
      return
    }
    addBooking(venue, selectedDate, selectedSlot, durationHours === 2 ? endTime : undefined)
    const rangeLabel = durationHours === 2 ? `${selectedSlot.start}–${endTime}` : `${selectedSlot.start}–${selectedSlot.end}`
    toast.success(`Booked ${venue.name} — ${format(selectedDate, 'EEE d MMM')} ${rangeLabel} (${formatCourtLabel(selectedSlot.courtId)})`)
    setSelectedSlot(null)
    setSelectedDate(null)
  }

  const dayForecast = selectedDate && weather?.daily.find((d) => d.date === format(selectedDate, 'yyyy-MM-dd'))

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <div className="max-w-[900px] mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="font-lora text-2xl font-semibold text-bark mb-2">Book by calendar</h1>
        <p className="text-sm text-bark-lt mb-6">Pick a date, then a time slot. Check 7-day weather before confirming.</p>

        <div className="mb-4">
          <label className="text-xs font-medium text-bark-lt block mb-2">Venue</label>
          <select
            value={venueId}
            onChange={(e) => { setVenueId(e.target.value); setSelectedDate(null); setSelectedSlot(null) }}
            className="w-full max-w-xs px-4 py-2.5 border border-[var(--border)] rounded-xl bg-white"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[20px] border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setMonth(subMonths(month, 1))}
                className="p-2 rounded-lg hover:bg-g50 text-bark-lt"
              >
                ←
              </button>
              <span className="font-lora font-semibold text-bark">{format(month, 'MMMM yyyy')}</span>
              <button
                type="button"
                onClick={() => setMonth(addMonths(month, 1))}
                className="p-2 rounded-lg hover:bg-g50 text-bark-lt"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-bark-lt font-medium mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isPast = day < new Date() && !isSameDay(day, new Date())
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={() => { setSelectedDate(day); setSelectedSlot(null) }}
                    className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                      isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-g50'
                    } ${isSelected ? 'bg-g600 text-white' : 'text-bark'}`}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            {weather && (
              <div className="bg-g50 rounded-xl border border-g200 p-3">
                <p className="text-[11px] font-semibold text-g600 uppercase tracking-wider mb-2">7-day weather</p>
                <div className="flex gap-2 overflow-x-auto">
                  {weather.daily.slice(0, 7).map((d) => (
                    <div
                      key={d.date}
                      className={`flex-shrink-0 w-12 text-center py-2 rounded-lg ${
                        selectedDate && d.date === format(selectedDate, 'yyyy-MM-dd') ? 'bg-g600 text-white' : 'bg-white'
                      }`}
                    >
                      <div className="text-[10px]">{format(parseISO(d.date), 'EEE')}</div>
                      <span>{weatherEmoji(d.weatherCode, d.precipitationProbabilityMax)}</span>
                      <div className="text-[11px] font-semibold">{Math.round(d.tempMax)}°</div>
                    </div>
                  ))}
                </div>
                {dayForecast && dayForecast.precipitationProbabilityMax >= 50 && (
                  <p className="text-xs text-a400 font-medium mt-2">⚠️ High rain chance — consider indoor or another day</p>
                )}
              </div>
            )}

            {selectedDate && (
              <div className="bg-white rounded-[20px] border border-[var(--border)] p-5">
                <p className="text-sm text-bark-lt mb-2">
                  {format(selectedDate, 'EEEE d MMM')} — {venue?.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {([1, 2] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => { setDurationHours(h); setSelectedSlot(null) }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                        durationHours === h ? 'bg-g50 border-g200 text-g800' : 'border-[var(--border)] text-bark-lt hover:bg-g50'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                  <span className="text-[11px] text-bark-lt">(max {MAX_BOOKING_HOURS}h)</span>
                </div>
                {slotsForDuration.length === 0 ? (
                  <p className="text-sm text-bark-lt">
                    {availableSlots.length === 0 ? 'No slots. Try another date.' : `No ${durationHours}h slots. Try 1h or another date.`}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {slotsForDuration.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-lg border text-sm ${
                            selectedSlot?.id === slot.id ? 'bg-g50 border-g200 font-semibold' : 'border-[var(--border)]'
                          }`}
                        >
                          <div>{slot.start}{durationHours === 2 ? `–${addHoursToTime(slot.start, 2)}` : ''}</div>
                          <div className="text-[10px] text-bark-lt">{formatCourtLabel(slot.courtId)}</div>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!selectedSlot}
                      onClick={handleConfirm}
                      className="w-full py-2.5 bg-g600 text-white rounded-xl font-semibold hover:bg-g800 disabled:opacity-50"
                    >
                      Confirm & book
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-bark-lt mt-6">
          <Link to="/" className="text-g600 font-medium hover:underline">← Back to Discover</Link>
        </p>
      </div>
    </div>
  )
}
