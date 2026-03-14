import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import toast from 'react-hot-toast'
import type { Venue } from '../data/venues'
import { Modal } from './Modal'
import { getAvailability } from '../api/courts'
import type { AvailabilityGrid } from '../api/courts'
import { formatCourtLabel } from '../data/booking'
import { fetchSydneyWeather, weatherEmoji } from '../data/weather'
import { useBooking, DEMO_USER } from '../context/BookingContext'

const MAX_HOURS = 2

interface QuickBookModalProps {
  venue: Venue
  onClose: () => void
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

export function QuickBookModal({ venue, onClose }: QuickBookModalProps) {
  const { addBooking } = useBooking()
  const [calDate, setCalDate] = useState(() => new Date())
  const [calAvail, setCalAvail] = useState<AvailabilityGrid | null>(null)
  const [calLoading, setCalLoading] = useState(false)
  const [weather, setWeather] = useState<Awaited<ReturnType<typeof fetchSydneyWeather>> | null>(null)
  const [calPicked, setCalPicked] = useState<Record<string, boolean>>({})

  const courtId = Number(venue.id)
  const isApiVenue = !Number.isNaN(courtId)
  const [bookingSuccess, setBookingSuccess] = useState<{
    venueName: string
    dateStr: string
    timeStr: string
    courtStr: string
  } | null>(null)

  useEffect(() => {
    if (!isApiVenue) {
      setCalAvail(null)
      return
    }
    const dateStr = format(calDate, 'yyyy-MM-dd')
    setCalLoading(true)
    getAvailability(courtId, dateStr)
      .then((res) => {
        if (res?.grid) setCalAvail(res as AvailabilityGrid)
        else setCalAvail(null)
      })
      .catch(() => setCalAvail(null))
      .finally(() => setCalLoading(false))
  }, [calDate, courtId, isApiVenue])

  useEffect(() => {
    fetchSydneyWeather().then(setWeather).catch(() => setWeather(null))
  }, [])

  /**
   * Slot click — same logic as CalendarBookPage:
   * max 2 consecutive hours, single court at a time
   */
  const handleSlotClick = useCallback(
    (courtNum: number, hour: number) => {
      if (!calAvail?.grid[courtNum]) return
      if (calAvail.grid[courtNum][hour] === 'booked') return
      const key = `${courtNum}-${hour}`

      setCalPicked((prev) => {
        const prevKeys = Object.keys(prev).filter((k) => prev[k])

        // Deselect if already picked
        if (prev[key]) {
          const next = { ...prev }
          delete next[key]
          return next
        }

        // No previous selection
        if (prevKeys.length === 0) return { [key]: true }

        // Different court → reset
        const currentCourt = parseInt(prevKeys[0].split('-')[0], 10)
        if (courtNum !== currentCourt) return { [key]: true }

        // Same court — check adjacency + max
        const currentHours = prevKeys.map((k) => parseInt(k.split('-')[1], 10)).sort((a, b) => a - b)
        const minH = currentHours[0]
        const maxH = currentHours[currentHours.length - 1]
        const isAdjacentBefore = hour === minH - 1
        const isAdjacentAfter = hour === maxH + 1

        if (!isAdjacentBefore && !isAdjacentAfter) return { [key]: true }
        if (currentHours.length >= MAX_HOURS) return { [key]: true }

        return { ...prev, [key]: true }
      })
    },
    [calAvail]
  )

  // Derive picked range
  const pickedKeys = Object.keys(calPicked).filter((k) => calPicked[k])
  const pickedCourt = pickedKeys.length > 0 ? parseInt(pickedKeys[0].split('-')[0], 10) : null
  const pickedHours = pickedKeys.map((k) => parseInt(k.split('-')[1], 10)).sort((a, b) => a - b)
  const startHour = pickedHours.length > 0 ? pickedHours[0] : 0
  const endHour = pickedHours.length > 0 ? pickedHours[pickedHours.length - 1] + 1 : 0
  const duration = endHour - startHour
  const hasSelection = pickedKeys.length > 0
  const canConfirm = hasSelection && duration > 0 && duration <= MAX_HOURS && isApiVenue

  const handleConfirm = async () => {
    if (!canConfirm || pickedCourt === null) return
    const payload = {
      court_id: courtId,
      court_number: pickedCourt,
      date: format(calDate, 'yyyy-MM-dd'),
      start_hour: startHour,
      end_hour: endHour,
      booker_name: DEMO_USER.name,
      booker_phone: DEMO_USER.phone,
      booker_email: DEMO_USER.email,
      players: 2,
    }
    const result = await addBooking(payload)
    if (result.success) {
      setBookingSuccess({
        venueName: venue.name,
        dateStr: format(calDate, 'EEE d MMM'),
        timeStr: `${formatHour(startHour)}–${formatHour(endHour)}`,
        courtStr: formatCourtLabel(`court-${pickedCourt}`),
      })
    } else {
      toast.error(result.error ?? 'Booking failed')
    }
  }

  const openHour = venue.open_hour ?? 7
  const closeHour = venue.close_hour ?? 22
  const hourOptions: number[] = []
  for (let h = openHour; h < closeHour; h++) hourOptions.push(h)

  const dayForecast = weather?.daily.find((d) => d.date === format(calDate, 'yyyy-MM-dd'))

  if (bookingSuccess) {
    const successModal = (
      <Modal
        open
        onClose={() => {
          setBookingSuccess(null)
          onClose()
        }}
        title="Booking confirmed"
        primaryAction={{
          label: 'Done',
          onClick: () => {
            setBookingSuccess(null)
            onClose()
          },
        }}
      >
        <p className="text-bark font-medium">{bookingSuccess.venueName}</p>
        <p className="mt-1 text-bark-lt">
          {bookingSuccess.dateStr} · {bookingSuccess.timeStr} · {bookingSuccess.courtStr}
        </p>
        <p className="mt-3 text-[12px] text-bark-lt">You can view or manage it in Schedule.</p>
      </Modal>
    )
    return createPortal(successModal, document.body)
  }

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-[20px] shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="font-lora text-lg font-semibold text-bark">Quick book — {venue.name}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-g50 text-bark-lt">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Date nav */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCalDate((d) => subDays(d, 1))
                  setCalPicked({})
                }}
                className="w-8 h-8 rounded-lg bg-[var(--cream)] border border-[var(--border)] flex items-center justify-center text-bark-lt hover:border-g600 hover:text-g600"
              >
                ‹
              </button>
              <span className="font-semibold text-bark min-w-[180px] text-center">
                {format(calDate, 'EEE, d MMM yyyy')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCalDate((d) => addDays(d, 1))
                  setCalPicked({})
                }}
                className="w-8 h-8 rounded-lg bg-[var(--cream)] border border-[var(--border)] flex items-center justify-center text-bark-lt hover:border-g600 hover:text-g600"
              >
                ›
              </button>
            </div>
            <div className="flex gap-3 text-[11px] text-bark-lt font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-2.5 rounded bg-green-dim border border-green-300/50" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-2.5 rounded border border-red-200/50"
                  style={{
                    background:
                      'repeating-linear-gradient(135deg, rgba(224,90,90,0.12), rgba(224,90,90,0.12) 3px, rgba(224,90,90,0.04) 3px, rgba(224,90,90,0.04) 6px)',
                  }}
                />
                Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-2.5 rounded bg-[var(--accent)] border border-[var(--accent-hover)]" /> Selected
              </span>
            </div>
          </div>

          {/* Weather strip — full width, evenly distributed */}
          {weather && (
            <div className="bg-g50 rounded-xl border border-g200 p-4">
              <p className="text-[11px] font-semibold text-g600 uppercase tracking-wider mb-3">7-day weather</p>
              <div className="grid grid-cols-7 gap-2">
                {weather.daily.slice(0, 7).map((d) => {
                  const isSelected = d.date === format(calDate, 'yyyy-MM-dd')
                  return (
                    <div
                      key={d.date}
                      className={`text-center py-2.5 rounded-lg transition-colors ${
                        isSelected ? 'bg-g600 text-white' : 'bg-white'
                      }`}
                    >
                      <div className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-bark-lt'}`}>
                        {format(new Date(d.date), 'EEE')}
                      </div>
                      <span className="text-lg">{weatherEmoji(d.weatherCode, d.precipitationProbabilityMax)}</span>
                      <div className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-bark'}`}>
                        {Math.round(d.tempMax)}°
                      </div>
                      <div className={`text-[10px] ${d.precipitationProbabilityMax >= 50 ? 'text-amber-500 font-medium' : isSelected ? 'text-white/60' : 'text-bark-lt'}`}>
                        {d.precipitationProbabilityMax}%
                      </div>
                    </div>
                  )
                })}
              </div>
              {dayForecast && dayForecast.precipitationProbabilityMax >= 50 && (
                <p className="text-xs text-amber-600 font-medium mt-3">⚠️ High rain chance — consider another day</p>
              )}
            </div>
          )}

          {/* Hint */}
          <p className="text-[11px] text-bark-lt">
            Click to select up to <strong>{MAX_HOURS} consecutive hours</strong> on one court.
          </p>

          {!isApiVenue ? (
            <p className="text-sm text-bark-lt">This venue cannot be booked here. Use Book in the menu.</p>
          ) : calLoading ? (
            <p className="text-sm text-bark-lt py-4">Loading availability…</p>
          ) : calAvail?.grid ? (
            <>
              <div className="space-y-3">
                {Array.from({ length: calAvail.courts_count }, (_, i) => i + 1).map((courtNum) => {
                  const surfaceLabel = calAvail.surface === 'synthetic_grass' ? 'Synthetic grass' : 'Hard court'
                  const isActiveCourt = pickedCourt === courtNum
                  return (
                    <div
                      key={courtNum}
                      className={`border rounded-[14px] p-3 transition-colors ${
                        isActiveCourt ? 'border-[#2DB87A] bg-[#F7FDF9]' : 'border-[var(--border)]'
                      }`}
                    >
                      <div className="text-[13px] font-semibold text-bark mb-2 flex items-center gap-2">
                        {surfaceLabel} court {courtNum}
                        {isActiveCourt && <span className="text-[10px] font-medium text-[#2DB87A]">● Selected</span>}
                      </div>
                      <div className="flex h-8 bg-[var(--cream)] rounded-lg overflow-hidden border border-[var(--border-light)]">
                        {hourOptions.map((hr) => {
                          const booked = calAvail.grid[courtNum]?.[hr] === 'booked'
                          const picked = !!calPicked[`${courtNum}-${hr}`]
                          let cls = 'flex-1 border-r border-[var(--border-light)] last:border-r-0 cursor-pointer transition-colors '
                          if (booked) cls += 'cursor-not-allowed '
                          if (picked) cls += 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] '
                          else if (!booked) cls += 'hover:bg-g50 '
                          return (
                            <button
                              key={hr}
                              type="button"
                              disabled={booked}
                              title={`${formatHour(hr)} – ${formatHour(hr + 1)}${booked ? ' (Booked)' : ''}`}
                              className={cls}
                              style={
                                booked
                                  ? {
                                      backgroundImage:
                                        'repeating-linear-gradient(135deg, rgba(224,90,90,0.12), rgba(224,90,90,0.12) 3px, rgba(224,90,90,0.04) 3px, rgba(224,90,90,0.04) 6px)',
                                    }
                                  : undefined
                              }
                              onClick={() => handleSlotClick(courtNum, hr)}
                            />
                          )
                        })}
                      </div>
                      <div className="flex mt-1">
                        {hourOptions.map((hr) => (
                          <div key={hr} className="flex-1 min-w-0 flex justify-start">
                            <span className="text-[9px] text-bark-lt font-medium leading-tight -translate-x-1/2">
                              {hr < 12 ? `${hr}am` : hr === 12 ? '12pm' : `${hr - 12}pm`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              {hasSelection && (
                <p className="text-sm text-bark-lt">
                  Selected: {formatCourtLabel(`court-${pickedCourt}`)} · {formatHour(startHour)} – {formatHour(endHour)} ({duration}h)
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={!canConfirm}
                  onClick={handleConfirm}
                  className="px-6 py-2.5 bg-g600 text-white rounded-xl text-sm font-semibold hover:bg-g800 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Confirm & book
                </button>
                <p className="text-[11px] text-bark-lt">
                  <strong className="text-a400">Rain-aware:</strong> outdoor courts eligible for one-click refund if it rains.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-bark-lt">No availability for this date.</p>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
