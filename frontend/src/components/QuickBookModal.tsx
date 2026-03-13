import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import type { Venue } from '../data/venues'
import type { TimeSlot } from '../data/booking'
import { getTimeSlotsForDate } from '../data/booking'
import { fetchSydneyWeather, weatherEmoji } from '../data/weather'
import { useBooking } from '../context/BookingContext'

interface QuickBookModalProps {
  venue: Venue
  onClose: () => void
}

export function QuickBookModal({ venue, onClose }: QuickBookModalProps) {
  const { addBooking } = useBooking()
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [weather, setWeather] = useState<Awaited<ReturnType<typeof fetchSydneyWeather>> | null>(null)

  const courtCount = Math.min(venue.courts ?? 2, 4)
  const slots = getTimeSlotsForDate(venue.id, selectedDate, courtCount, venue.openingHours)
  const availableSlots = slots.filter((s) => s.available)

  useEffect(() => {
    fetchSydneyWeather().then(setWeather).catch(() => setWeather(null))
  }, [])

  const handleConfirm = () => {
    if (!selectedSlot) return
    addBooking(venue, selectedDate, selectedSlot)
    toast.success(`Booked ${venue.name} — ${format(selectedDate, 'EEE d MMM')} ${selectedSlot.start}–${selectedSlot.end}`)
    onClose()
  }

  const dateOptions = [0, 1, 2, 3, 4, 5, 6].map((d) => addDays(new Date(), d))
  const dayForecast = weather?.daily.find((x) => x.date === format(selectedDate, 'yyyy-MM-dd'))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-[20px] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="font-lora text-lg font-semibold text-bark">Quick book — {venue.name}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-g50 text-bark-lt">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs text-bark-lt mb-2">Date</p>
            <div className="flex flex-wrap gap-2">
              {dateOptions.map((d) => (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => { setSelectedDate(d); setSelectedSlot(null) }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border ${
                    format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                      ? 'bg-g50 border-g200 text-g800'
                      : 'border-[var(--border)] text-bark-lt hover:bg-g50'
                  }`}
                >
                  {format(d, 'EEE d')}
                </button>
              ))}
            </div>
          </div>

          {weather && (
            <div className="bg-g50 rounded-xl border border-g200 p-3">
              <p className="text-[11px] font-semibold text-g600 uppercase tracking-wider mb-2">7-day weather</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {weather.daily.slice(0, 7).map((d) => (
                  <div
                    key={d.date}
                    className={`flex-shrink-0 w-14 text-center py-2 rounded-lg ${
                      d.date === format(selectedDate, 'yyyy-MM-dd') ? 'bg-g600 text-white' : 'bg-white'
                    }`}
                  >
                    <div className="text-[10px]">{format(parseISO(d.date), 'EEE')}</div>
                    <span className="text-lg">{weatherEmoji(d.weatherCode, d.precipitationProbabilityMax)}</span>
                    <div className="text-[11px] font-semibold">{Math.round(d.tempMax)}°</div>
                    {d.precipitationProbabilityMax >= 40 && (
                      <div className="text-[10px] opacity-90">💧{d.precipitationProbabilityMax}%</div>
                    )}
                  </div>
                ))}
              </div>
              {dayForecast && dayForecast.precipitationProbabilityMax >= 50 && (
                <p className="text-xs text-a400 font-medium mt-2">⚠️ High rain chance this day — consider indoor or reschedule</p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-bark-lt mb-2">Time — {format(selectedDate, 'EEE d MMM')}</p>
            {availableSlots.length === 0 ? (
              <p className="text-sm text-bark-lt">No slots this day. Try another date.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 rounded-lg border text-center text-sm transition-colors ${
                      selectedSlot?.id === slot.id
                        ? 'bg-g50 border-g200 text-g800 font-semibold'
                        : 'border-[var(--border)] hover:bg-g50'
                    }`}
                  >
                    <div>{slot.start}</div>
                    <div className="text-[10px] text-bark-lt">{slot.courtId}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-g600 text-white rounded-xl text-sm font-semibold hover:bg-g800 disabled:opacity-50 disabled:pointer-events-none"
            >
              Confirm & book
            </button>
            <p className="text-[11px] text-bark-lt">
              <strong className="text-a400">Rain-aware:</strong> outdoor courts eligible for one-click refund if it rains.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
