import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { Modal } from '../components/Modal'
import { useBooking, DEMO_USER } from '../context/BookingContext'
import { getWeatherForCourt } from '../api/weather'
import type { Booking } from '../api/bookings'
import type { WeatherData } from '../api/weather'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
} from 'date-fns'

type EnrichedBooking = Booking & { _weather?: WeatherData | null; _hoursUntil?: number | null }

function fmtH(h: number) {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function BookingCard({
  booking: b,
  onCancel,
  onWeatherRefund,
}: {
  booking: EnrichedBooking
  onCancel: (id: number, totalPrice: number, hoursUntil: number | null) => void
  onWeatherRefund: (id: number, amount: number) => void
}) {
  const sf = b.surface === 'synthetic_grass' ? 'Synthetic grass' : 'Hard court'
  const hoursUntil = b._hoursUntil ?? null
  const canCancel = b.status === 'confirmed' && (hoursUntil === null || hoursUntil >= 24)
  const within24h = b.status === 'confirmed' && hoursUntil !== null && hoursUntil > 0 && hoursUntil < 24
  const hasWeatherWarning = !!b._weather
  const canWeatherRefund = hasWeatherWarning && (hoursUntil ?? 0) >= 24

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green/10 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-sky-100 text-sky-800',
  }

  return (
    <div
      className={`bg-white border border-[var(--border)] rounded-[14px] p-4 mb-3 ${
        b.status !== 'confirmed' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <span className="text-sm font-semibold text-bark">{b.court_name}</span>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex-shrink-0 ${
            statusColors[b.status] || 'bg-gray-100 text-bark-lt'
          }`}
        >
          {b.status}
        </span>
      </div>
      <div className="text-xs text-bark-lt mb-1">📐 {sf} court {b.court_number}</div>
      <div className="text-xs text-bark-lt mb-1">📅 {b.date}</div>
      <div className="text-xs text-bark-lt mb-2">
        🕐 {fmtH(b.start_hour)} – {fmtH(b.end_hour)} · {b.players} players
      </div>
      <div className="text-base font-bold text-g600">${b.total_price}</div>

      {/* Weather warning */}
      {hasWeatherWarning && (
        <div className="mt-3 p-3 bg-gradient-to-br from-[#FFF8E1] to-[#FFF4D4] border-[1.5px] border-[rgba(232,168,48,0.3)] rounded-[10px]">
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#9A6D00] mb-1.5">⛈ Weather alert</div>
          <div className="text-[11.5px] text-[#8A6800] leading-relaxed mb-2.5">
            {Math.round(b._weather!.rain_prob)}% chance of rain on {b.date}
            {b._weather!.description ? ` · ${b._weather!.description}` : ''}
          </div>
          {canWeatherRefund ? (
            <button
              onClick={() => onWeatherRefund(b.id, b.total_price)}
              className="w-full py-2.5 text-center bg-warning text-white rounded-lg text-[13px] font-semibold hover:bg-[#D49A20] transition-all"
            >
              Request weather refund — ${b.total_price}
            </button>
          ) : (
            <span className="text-[11px] text-bark-lt">Less than 24h — weather refund unavailable.</span>
          )}
        </div>
      )}

      {/* Cancel / View venue */}
      {b.status === 'confirmed' && (
        <div className="mt-2.5 flex gap-2">
          <Link
            to={`/venue/${b.court_id}`}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[var(--border)] text-bark hover:bg-g50"
          >
            View venue
          </Link>
          {canCancel ? (
            <button
              type="button"
              onClick={() => onCancel(b.id, b.total_price, hoursUntil ?? null)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
            >
              Cancel & refund
            </button>
          ) : within24h ? (
            <span className="px-3.5 py-2 text-[11px] text-bark-lt self-center">Within 24h — cancel unavailable</span>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function BookingsPage() {
  const { bookings, loading, removeBooking, requestRefund } = useBooking()
  const [enriched, setEnriched] = useState<EnrichedBooking[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [actionConfirm, setActionConfirm] = useState<{
    id: number
    amount: number
    reason: 'weather' | 'cancel'
  } | null>(null)
  const [refundSuccess, setRefundSuccess] = useState<number | null>(null)

  const enrichBookings = useCallback(async () => {
    const now = new Date()
    const results = await Promise.all(
      bookings.map(async (b): Promise<EnrichedBooking> => {
        const eb: EnrichedBooking = { ...b, _weather: undefined, _hoursUntil: undefined }
        if (b.status === 'confirmed') {
          const bs = new Date(`${b.date}T${String(b.start_hour).padStart(2, '0')}:00:00`)
          eb._hoursUntil = (bs.getTime() - now.getTime()) / (1000 * 60 * 60)
          if (eb._hoursUntil > 0 && eb._hoursUntil <= 48) {
            try {
              const wd = await getWeatherForCourt(b.court_id, b.date)
              if (wd.success && wd.weather != null && wd.weather.rain_prob >= 50) eb._weather = wd.weather
            } catch {}
          }
        }
        return eb
      })
    )
    setEnriched(results)
  }, [bookings])

  useEffect(() => {
    if (bookings.length > 0) enrichBookings()
  }, [bookings, enrichBookings])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  /**
   * Per-date status summary for calendar colouring.
   * - hasAny: at least one booking on that date
   * - hasConfirmed: at least one confirmed (upcoming/active) booking
   */
  const dateStatus = useMemo(() => {
    const map: Record<string, { hasAny: boolean; hasConfirmed: boolean }> = {}
    for (const b of enriched) {
      if (!map[b.date]) {
        map[b.date] = { hasAny: false, hasConfirmed: false }
      }
      map[b.date].hasAny = true
      if (b.status === 'confirmed') {
        map[b.date].hasConfirmed = true
      }
    }
    return map
  }, [enriched])

  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const calendarPadStart = monthStart.getDay()
  const calendarPadEnd = (7 - ((calendarPadStart + calendarDays.length) % 7)) % 7

  const filteredByDate = selectedDate ? enriched.filter((b) => b.date === selectedDate) : enriched
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredByDate
    const q = searchQuery.toLowerCase()
    return filteredByDate.filter(
      (b) =>
        (b.court_name && b.court_name.toLowerCase().includes(q)) ||
        (b.court_address && b.court_address.toLowerCase().includes(q))
    )
  }, [filteredByDate, searchQuery])
  const upcoming = useMemo(() => {
    const list = filteredBySearch.filter((b) => b.date >= todayStr && b.status === 'confirmed')
    return [...list].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.start_hour ?? 0) - (b.start_hour ?? 0)
    })
  }, [filteredBySearch, todayStr])
  const past = useMemo(() => {
    const list = filteredBySearch.filter((b) => b.date < todayStr || b.status !== 'confirmed')
    return [...list].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return (b.start_hour ?? 0) - (a.start_hour ?? 0)
    })
  }, [filteredBySearch, todayStr])

  // Credit total from all refunded/cancelled bookings
  const creditTotal = bookings.filter((b) => b.status === 'refunded' || b.status === 'cancelled').reduce((s, b) => s + b.total_price, 0)

  const handleCancel = useCallback((id: number, totalPrice: number, hoursUntil: number | null) => {
    if (hoursUntil !== null && hoursUntil < 24) return
    setActionConfirm({ id, amount: totalPrice, reason: 'cancel' })
  }, [])

  const handleWeatherRefund = useCallback((id: number, amount: number) => {
    setActionConfirm({ id, amount, reason: 'weather' })
  }, [])

  const handleActionConfirm = useCallback(async () => {
    if (!actionConfirm) return
    const { id, amount, reason } = actionConfirm
    setActionConfirm(null)
    if (reason === 'weather') {
      const res = await requestRefund(id)
      if (res.success) setRefundSuccess(res.refund_amount ?? amount)
      else alert(res.error || 'Refund failed')
    } else {
      await removeBooking(id)
      setRefundSuccess(amount)
    }
  }, [actionConfirm, requestRefund, removeBooking])

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <div className="flex-1 flex max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-[280px] flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-[var(--border)] p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-bark mb-3">Calendar</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-bark">{format(calendarMonth, 'MMMM yyyy')}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                  className="w-7 h-7 rounded-lg bg-[var(--cream)] border border-[var(--border)] flex items-center justify-center text-bark-lt hover:border-g600 hover:text-g600"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                  className="w-7 h-7 rounded-lg bg-[var(--cream)] border border-[var(--border)] flex items-center justify-center text-bark-lt hover:border-g600 hover:text-g600"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-bark-lt mb-1">
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
                const status = dateStatus[dateStr]
                const hasBooking = status?.hasAny
                const hasConfirmed = status?.hasConfirmed
                const isSelected = selectedDate === dateStr
                const isToday = isSameDay(day, today)
                const isCurrentMonth = isSameMonth(day, calendarMonth)
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`aspect-square rounded-lg text-[11px] font-medium flex flex-col items-center justify-center transition-colors ${
                      !isCurrentMonth ? 'text-bark-lt/50' : 'text-bark'
                    } ${isToday ? 'ring-2 ring-g600 ring-offset-1' : ''} ${
                      hasBooking
                        ? hasConfirmed
                          ? 'bg-g100 text-g800 font-semibold'
                          : 'bg-bark-lt/10 text-bark-lt'
                        : 'hover:bg-g50'
                    } ${isSelected ? 'bg-g600 text-white' : ''}`}
                  >
                    {format(day, 'd')}
                    {hasBooking && !isSelected && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          hasConfirmed ? 'bg-g600' : 'bg-bark-lt'
                        }`}
                      />
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
                className="mt-2 text-[11px] font-medium text-g600 hover:underline"
              >
                Show all dates
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-4 shadow-sm">
            <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Venue or address…"
              className="w-full px-3 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-sm text-bark placeholder:text-bark-lt focus:border-g600 focus:ring-2 focus:ring-g200 outline-none"
            />
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-2">Account</div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-full bg-g100 flex items-center justify-center text-g800 text-sm font-bold">
                {DEMO_USER.name.slice(0, 1)}
              </div>
              <div>
                <div className="text-sm font-semibold text-bark">{DEMO_USER.name}</div>
                <div className="text-[11px] text-bark-lt">{DEMO_USER.email}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border)]">
              <div className="text-[11px] font-medium text-bark-lt">Credit</div>
              <div className={`text-sm font-semibold ${creditTotal > 0 ? 'text-g600' : 'text-bark-lt'}`}>
                ${creditTotal}
              </div>
              <div className="text-[10px] text-bark-lt">From cancellations & weather refunds</div>
            </div>
          </div>
        </aside>

        {/* Confirm modal — styled like weather refund */}
        <Modal
          open={!!actionConfirm}
          onClose={() => setActionConfirm(null)}
          title={actionConfirm?.reason === 'weather' ? 'Request weather refund?' : 'Cancel & refund booking?'}
          primaryAction={{ label: 'Confirm refund', onClick: handleActionConfirm }}
          secondaryAction={{ label: 'Go back', onClick: () => setActionConfirm(null) }}
        >
          {actionConfirm && (
            <div>
              <p className="mb-2">
                {actionConfirm.reason === 'weather'
                  ? `Weather conditions allow a full refund.`
                  : `You are cancelling this booking.`}
              </p>
              <div className="bg-gradient-to-br from-[#F0FAF2] to-[#FAFFF0] border border-[rgba(45,184,122,0.2)] rounded-lg p-3 mt-2">
                <div className="text-[11px] font-semibold text-g600 uppercase tracking-wider mb-1">Refund amount</div>
                <div className="text-xl font-bold text-g600">${actionConfirm.amount}</div>
                <div className="text-[11px] text-bark-lt mt-1">Will be credited to your account immediately.</div>
              </div>
            </div>
          )}
        </Modal>
        <Modal
          open={refundSuccess !== null}
          onClose={() => setRefundSuccess(null)}
          title="Refund successful"
          primaryAction={{ label: 'Done', onClick: () => setRefundSuccess(null) }}
        >
          {refundSuccess != null && (
            <div>
              <div className="bg-gradient-to-br from-[#F0FAF2] to-[#FAFFF0] border border-[rgba(45,184,122,0.2)] rounded-lg p-3 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-xl font-bold text-g600">${refundSuccess}</div>
                <div className="text-[12px] text-bark-lt mt-1">has been credited to your account.</div>
              </div>
              <p className="text-[12px] text-bark-lt mt-3 text-center">You can use it for future bookings.</p>
            </div>
          )}
        </Modal>

        {/* Main list */}
        <main className="flex-1 min-w-0">
          <h1 className="font-lora text-2xl font-semibold text-bark mb-1">My schedule</h1>
          <p className="text-sm text-bark-lt mb-6">
            Your upcoming court bookings. Cancel 24h+ in advance for a full refund.
          </p>
          {loading ? (
            <div className="text-center py-12 text-bark-lt">Loading…</div>
          ) : enriched.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center">
              <p className="text-bark-lt mb-4">No bookings yet.</p>
              <Link to="/" className="text-g600 font-medium hover:underline">
                Discover venues →
              </Link>
            </div>
          ) : filteredBySearch.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--border)] p-8 text-center">
              <p className="text-bark-lt">
                {selectedDate
                  ? `No bookings on ${format(new Date(selectedDate + 'T12:00:00'), 'EEE, d MMM')}.`
                  : 'No results for this search.'}
              </p>
              {selectedDate && (
                <Link
                  to={`/book?date=${selectedDate}`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-g600 text-white text-sm font-medium hover:bg-g800 transition-colors"
                >
                  Quick book for this day →
                </Link>
              )}
            </div>
          ) : (
            <>
              {selectedDate && (
                <p className="text-[12px] font-medium text-bark-lt mb-3">
                  {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, d MMM yyyy')} — {filteredBySearch.length}{' '}
                  booking(s)
                </p>
              )}
              {upcoming.length > 0 && (
                <>
                  {!selectedDate && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-bark-lt mb-2">Upcoming</div>
                  )}
                  {upcoming.map((b) => (
                    <BookingCard key={b.id} booking={b} onCancel={handleCancel} onWeatherRefund={handleWeatherRefund} />
                  ))}
                </>
              )}
              {past.length > 0 && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-bark-lt mt-6 mb-2 pt-4 border-t border-[var(--border)]">
                    Past & cancelled
                  </div>
                  {past.map((b) => (
                    <BookingCard key={b.id} booking={b} onCancel={handleCancel} onWeatherRefund={handleWeatherRefund} />
                  ))}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
