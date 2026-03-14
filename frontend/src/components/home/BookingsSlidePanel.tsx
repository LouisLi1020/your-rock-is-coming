// src/components/home/BookingsSlidePanel.tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns'
import { useBooking, DEMO_USER } from '../../context/BookingContext'
import { Modal } from '../Modal'
import { getWeatherForCourt } from '../../api/weather'
import type { Booking } from '../../api/bookings'
import type { WeatherData } from '../../api/weather'

type EnrichedBooking = Booking & { _weather?: WeatherData | null; _hoursUntil?: number | null }

function fmtH(h: number) {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

type Props = {
  open: boolean
  onClose: () => void
}

export function BookingsSlidePanel({ open, onClose }: Props) {
  const { bookings, loading, removeBooking, requestRefund } = useBooking()
  const [enriched, setEnriched] = useState<EnrichedBooking[]>([])
  const [hasWarning, setHasWarning] = useState(false)
  /** Filter by date (YYYY-MM-DD). null = show all */
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  /** Calendar month for the mini calendar */
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [refundConfirm, setRefundConfirm] = useState<{ id: number; amount: number } | null>(null)
  const [refundSuccess, setRefundSuccess] = useState<number | null>(null)

  // Enrich bookings with weather data
  const enrichBookings = useCallback(async () => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    const results = await Promise.all(
      bookings.map(async (b): Promise<EnrichedBooking> => {
        const eb: EnrichedBooking = { ...b, _weather: null, _hoursUntil: null }
        if (b.status === 'confirmed') {
          const bs = new Date(`${b.date}T${String(b.start_hour).padStart(2, '0')}:00:00`)
          eb._hoursUntil = (bs.getTime() - now.getTime()) / (1000 * 60 * 60)
          if (eb._hoursUntil > 0 && eb._hoursUntil <= 48) {
            try {
              const wd = await getWeatherForCourt(b.court_id, b.date)
              if (wd.success && wd.weather.rain_prob >= 50) {
                eb._weather = wd.weather
              }
            } catch {}
          }
        }
        return eb
      })
    )

    setEnriched(results)
    setHasWarning(results.some((b) => b._weather))
  }, [bookings])

  useEffect(() => {
    if (bookings.length > 0) enrichBookings()
  }, [bookings, enrichBookings])

  // Expose warning state via DOM for the avatar dot
  useEffect(() => {
    const dot = document.getElementById('notifDot')
    if (dot) dot.classList.toggle('show', hasWarning)
  }, [hasWarning])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const datesWithBookings = useMemo(() => new Set(enriched.map((b) => b.date)), [enriched])

  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const calendarPadStart = monthStart.getDay()
  const calendarPadEnd = (7 - ((calendarPadStart + calendarDays.length) % 7)) % 7

  const filteredByDate = selectedDate
    ? enriched.filter((b) => b.date === selectedDate)
    : null
  const upcoming = (filteredByDate ?? enriched).filter((b) => b.date >= todayStr && b.status === 'confirmed')
  const past = (filteredByDate ?? enriched).filter((b) => b.date < todayStr || b.status !== 'confirmed')

  async function handleCancel(id: number) {
    if (!confirm('Cancel this booking?')) return
    await removeBooking(id)
  }

  function handleRefundClick(id: number, amount: number) {
    setRefundConfirm({ id, amount })
  }

  async function handleRefundConfirm() {
    if (!refundConfirm) return
    const { id, amount } = refundConfirm
    setRefundConfirm(null)
    const res = await requestRefund(id)
    if (res.success) setRefundSuccess(res.refund_amount ?? amount)
    else alert(res.error || 'Refund failed')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-[1000] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 w-[460px] h-screen bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.1)] z-[1001] flex flex-col transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3.5 border-b border-[#E8E6E1] flex items-center justify-between">
          <h2 className="text-lg font-bold">My schedule</h2>
          <button
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-full bg-cream border border-[#E8E6E1] flex items-center justify-center text-ink-muted text-base hover:text-ink hover:bg-cream-dark"
          >
            ✕
          </button>
        </div>
        {/* User info + credit */}
        <div className="px-6 py-3.5 bg-cream border-b border-[#F0EDE8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-base font-bold text-ink">A</div>
            <div>
              <div className="text-sm font-semibold">{DEMO_USER.name}</div>
              <div className="text-[11px] text-ink-muted">{DEMO_USER.email}</div>
            </div>
          </div>
          {(() => {
            const creditTotal = bookings.filter((b) => b.status === 'refunded').reduce((s, b) => s + b.total_price, 0)
            if (creditTotal <= 0) return null
            return (
              <div className="mt-2.5 pt-2.5 border-t border-[#E8E6E1]">
                <div className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Credit</div>
                <div className="text-sm font-bold text-green">${creditTotal}</div>
                <div className="text-[10px] text-ink-muted">From weather refunds</div>
              </div>
            )
          })()}
        </div>
        {/* Mini calendar */}
        <div className="px-6 py-4 border-b border-[#F0EDE8]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-bark">{format(calendarMonth, 'MMMM yyyy')}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                className="w-7 h-7 rounded-lg bg-cream border border-[#E8E6E1] flex items-center justify-center text-ink-muted text-sm hover:border-green hover:text-green"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                className="w-7 h-7 rounded-lg bg-cream border border-[#E8E6E1] flex items-center justify-center text-ink-muted text-sm hover:border-green hover:text-green"
              >
                ›
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-ink-muted mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: calendarPadStart }, (_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {calendarDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const hasBooking = datesWithBookings.has(dateStr)
              const isSelected = selectedDate === dateStr
              const isToday = isSameDay(day, today)
              const isCurrentMonth = isSameMonth(day, calendarMonth)
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`aspect-square rounded-lg text-[11px] font-medium flex flex-col items-center justify-center transition-colors ${
                    !isCurrentMonth ? 'text-ink-faint' : ''
                  } ${isToday ? 'ring-1 ring-green ring-offset-1 ring-offset-white' : ''} ${
                    hasBooking ? 'bg-green/15 text-green-800 font-semibold' : 'hover:bg-cream'
                  } ${isSelected ? 'bg-green text-white hover:bg-green' : ''}`}
                >
                  {format(day, 'd')}
                  {hasBooking && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green mt-0.5" />
                  )}
                </button>
              )
            })}
            {Array.from({ length: calendarPadEnd }, (_, i) => (
              <div key={`padEnd-${i}`} className="aspect-square" />
            ))}
          </div>
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="mt-2 text-[11px] font-medium text-green hover:underline"
            >
              Show all dates
            </button>
          )}
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
          {loading ? (
            <div className="text-center py-10 text-ink-muted text-sm">Loading...</div>
          ) : enriched.length === 0 ? (
            <div className="text-center py-10 text-ink-muted text-sm">No bookings yet.</div>
          ) : selectedDate && upcoming.length === 0 && past.length === 0 ? (
            <div className="text-center py-6 text-ink-muted text-sm">
              No bookings on {format(new Date(selectedDate + 'T12:00:00'), 'EEE, d MMM')}.
            </div>
          ) : (
            <>
              {selectedDate && (
                <p className="text-[11px] font-semibold text-ink-muted mb-2.5">
                  {format(new Date(selectedDate + 'T12:00:00'), "EEEE, d MMM yyyy")} — {upcoming.length + past.length} booking(s)
                </p>
              )}
              {upcoming.length > 0 && (
                <>
                  {!selectedDate && (
                    <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-ink-muted mb-2.5">Upcoming</div>
                  )}
                  {upcoming.map((b) => (
                    <BookingCard key={b.id} booking={b} onCancel={handleCancel} onRefund={handleRefundClick} />
                  ))}
                </>
              )}
              {past.length > 0 && (
                <>
                  {!selectedDate && (
                    <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-ink-muted mt-4 mb-2.5 pt-2 border-t border-[#F0EDE8]">Past & Cancelled</div>
                  )}
                  {past.map((b) => (
                    <BookingCard key={b.id} booking={b} onCancel={handleCancel} onRefund={handleRefundClick} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <Modal
        open={!!refundConfirm}
        onClose={() => setRefundConfirm(null)}
        title="Request weather refund?"
        primaryAction={{ label: 'Confirm', onClick: handleRefundConfirm }}
        secondaryAction={{ label: 'Cancel', onClick: () => setRefundConfirm(null) }}
      >
        {refundConfirm && (
          <p>You will receive <strong>${refundConfirm.amount}</strong> as account credit. Continue?</p>
        )}
      </Modal>
      <Modal
        open={refundSuccess !== null}
        onClose={() => setRefundSuccess(null)}
        title="Refund successful"
        primaryAction={{ label: 'Done', onClick: () => setRefundSuccess(null) }}
      >
        {refundSuccess != null && (
          <p>${refundSuccess} has been credited to your account. You can use it for future bookings.</p>
        )}
      </Modal>
    </>
  )
}

function BookingCard({ booking: b, onCancel, onRefund }: {
  booking: EnrichedBooking
  onCancel: (id: number) => void
  onRefund: (id: number, amount: number) => void
}) {
  const sf = b.surface === 'synthetic_grass' ? 'Synthetic grass' : 'Hard court'
  const canRefund = b._weather && (b._hoursUntil ?? 0) >= 24
  const statusColors: Record<string, string> = {
    confirmed: 'bg-green/10 text-green-text',
    cancelled: 'bg-danger/10 text-[#B83030]',
    refunded: 'bg-[rgba(96,165,250,0.1)] text-[#2878A8]',
  }

  return (
    <div className={`bg-white border-[1.5px] border-[#E8E6E1] rounded-[14px] p-4 mb-3 ${b.status !== 'confirmed' ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold">{b.court_name}</span>
        <span className={`text-[10px] font-bold px-2.5 py-[3px] rounded-full uppercase tracking-[0.5px] ${statusColors[b.status] || ''}`}>
          {b.status}
        </span>
      </div>
      <div className="text-xs text-ink-muted mb-[3px] flex items-center gap-[5px]">📐 {sf} court {b.court_number}</div>
      <div className="text-xs text-ink-muted mb-[3px] flex items-center gap-[5px]">📅 {b.date}</div>
      <div className="text-xs text-ink-muted mb-[3px] flex items-center gap-[5px]">🕐 {fmtH(b.start_hour)} – {fmtH(b.end_hour)} · {b.players} players</div>
      <div className="text-[15px] font-bold text-green mt-1.5">${b.total_price}</div>

      {/* Weather warning */}
      {b._weather && (
        <div className="mt-3 p-3 bg-gradient-to-br from-[#FFF8E1] to-[#FFF4D4] border-[1.5px] border-[rgba(232,168,48,0.3)] rounded-[10px]">
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#9A6D00] mb-1.5">⛈ Weather Alert</div>
          <div className="text-[11.5px] text-[#8A6800] leading-relaxed mb-2.5">
            {Math.round(b._weather.rain_prob)}% chance of rain on {b.date}
            {b._weather.description ? ` · ${b._weather.description}` : ''}
            {b._weather.wind_speed ? ` · Wind ${b._weather.wind_speed} m/s` : ''}
          </div>
          <div className="text-[10px] text-ink-muted mb-2.5 px-2.5 py-1.5 bg-white/60 rounded-[6px]">
            📋 Free cancellation available up to 24 hours before your booking.
          </div>
          {canRefund ? (
            <button
              onClick={() => onRefund(b.id, b.total_price)}
              className="w-full py-2.5 text-center bg-warning text-white rounded-[6px] text-[13px] font-semibold hover:bg-[#D49A20] hover:-translate-y-px transition-all"
            >
              Request Weather Refund — ${b.total_price}
            </button>
          ) : (
            <button disabled className="w-full py-2.5 text-center bg-warning text-white rounded-[6px] text-[13px] font-semibold opacity-50 cursor-not-allowed">
              Less than 24hrs — refund unavailable
            </button>
          )}
        </div>
      )}

      {/* Cancel button (no weather warning) */}
      {b.status === 'confirmed' && !b._weather && (
        <div className="mt-2.5">
          <button
            onClick={() => onCancel(b.id)}
            className="px-3.5 py-[7px] bg-transparent border-[1.5px] border-[#E8E6E1] rounded-[6px] text-xs font-medium text-ink-muted hover:border-danger hover:text-danger transition-all"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
