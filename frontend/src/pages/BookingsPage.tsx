import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { Modal } from '../components/Modal'
import { useBooking, DEMO_USER } from '../context/BookingContext'
import { getWeatherForCourt } from '../api/weather'
import type { Booking } from '../api/bookings'
import type { WeatherData } from '../api/weather'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns'

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
  onRefund,
}: {
  booking: EnrichedBooking
  onCancel: (id: number) => void
  onRefund: (id: number, amount: number) => void
}) {
  const sf = b.surface === 'synthetic_grass' ? 'Synthetic grass' : 'Hard court'
  const canRefund = b._weather && (b._hoursUntil ?? 0) >= 24
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
      <div className="text-xs text-bark-lt mb-2">🕐 {fmtH(b.start_hour)} – {fmtH(b.end_hour)} · {b.players} players</div>
      <div className="text-base font-bold text-g600">${b.total_price}</div>

      {b._weather && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200/60 rounded-[10px]">
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-amber-800 mb-1.5">⛈ Weather alert</div>
          <div className="text-[11.5px] text-amber-700 leading-relaxed mb-2.5">
            {Math.round(b._weather.rain_prob)}% chance of rain
            {b._weather.description ? ` · ${b._weather.description}` : ''}
          </div>
          {canRefund ? (
            <button
              onClick={() => onRefund(b.id, b.total_price)}
              className="w-full py-2.5 text-center bg-amber-500 text-white rounded-lg text-[13px] font-semibold hover:bg-amber-600"
            >
              Request weather refund — ${b.total_price}
            </button>
          ) : (
            <span className="text-[11px] text-bark-lt">Refund available up to 24h before.</span>
          )}
        </div>
      )}

      {b.status === 'confirmed' && !b._weather && (
        <div className="mt-2.5 flex gap-2">
          <Link
            to={`/venue/${b.court_id}`}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[var(--border)] text-bark hover:bg-g50"
          >
            View venue
          </Link>
          <button
            type="button"
            onClick={() => onCancel(b.id)}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
          >
            Cancel
          </button>
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
  const [refundConfirm, setRefundConfirm] = useState<{ id: number; amount: number } | null>(null)
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
              if (wd.success && wd.weather.rain_prob >= 50) eb._weather = wd.weather
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
  const datesWithBookings = useMemo(() => new Set(enriched.map((b) => b.date)), [enriched])

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
  const upcoming = filteredBySearch.filter((b) => b.date >= todayStr && b.status === 'confirmed')
  const past = filteredBySearch.filter((b) => b.date < todayStr || b.status !== 'confirmed')

  const handleCancel = useCallback(
    async (id: number) => {
      if (!confirm('Cancel this booking?')) return
      await removeBooking(id)
    },
    [removeBooking]
  )

  const handleRefundClick = useCallback((id: number, amount: number) => {
    setRefundConfirm({ id, amount })
  }, [])

  const handleRefundConfirm = useCallback(async () => {
    if (!refundConfirm) return
    const { id, amount } = refundConfirm
    setRefundConfirm(null)
    const res = await requestRefund(id)
    if (res.success) setRefundSuccess(res.refund_amount ?? amount)
    else alert(res.error || 'Refund failed')
  }, [refundConfirm, requestRefund])

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <div className="flex-1 flex max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Sidebar: calendar + search */}
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
                      !isCurrentMonth ? 'text-bark-lt/50' : 'text-bark'
                    } ${isToday ? 'ring-2 ring-g600 ring-offset-1' : ''} ${
                      hasBooking ? 'bg-g100 text-g800 font-semibold' : 'hover:bg-g50'
                    } ${isSelected ? 'bg-g600 text-white' : ''}`}
                  >
                    {format(day, 'd')}
                    {hasBooking && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-g600 mt-0.5" />}
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
            <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-2">
              Search
            </label>
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
            {(() => {
              const creditTotal = bookings.filter((b) => b.status === 'refunded').reduce((s, b) => s + b.total_price, 0)
              if (creditTotal <= 0) return null
              return (
                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="text-[11px] font-medium text-bark-lt">Credit</div>
                  <div className="text-sm font-semibold text-g600">${creditTotal}</div>
                  <div className="text-[10px] text-bark-lt">From weather refunds</div>
                </div>
              )
            })()}
          </div>
        </aside>

        <Modal
          open={!!refundConfirm}
          onClose={() => setRefundConfirm(null)}
          title="Request weather refund?"
          primaryAction={{ label: 'Confirm', onClick: handleRefundConfirm }}
          secondaryAction={{ label: 'Cancel', onClick: () => setRefundConfirm(null) }}
        >
          {refundConfirm && (
            <>
              <p className="mb-2">You will receive <strong>${refundConfirm.amount}</strong> as account credit. Continue?</p>
            </>
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

        {/* Main: list */}
        <main className="flex-1 min-w-0">
          <h1 className="font-lora text-2xl font-semibold text-bark mb-1">My schedule</h1>
          <p className="text-sm text-bark-lt mb-6">
            Your upcoming court bookings. Rain-aware refund available for outdoor courts.
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
            </div>
          ) : (
            <>
              {selectedDate && (
                <p className="text-[12px] font-medium text-bark-lt mb-3">
                  {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, d MMM yyyy')} — {filteredBySearch.length} booking(s)
                </p>
              )}
              {upcoming.length > 0 && (
                <>
                  {!selectedDate && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-bark-lt mb-2">Upcoming</div>
                  )}
                  {upcoming.map((b) => (
                    <BookingCard key={b.id} booking={b} onCancel={handleCancel} onRefund={handleRefundClick} />
                  ))}
                </>
              )}
              {past.length > 0 && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-bark-lt mt-6 mb-2 pt-4 border-t border-[var(--border)]">
                    Past & cancelled
                  </div>
                  {past.map((b) => (
                    <BookingCard key={b.id} booking={b} onCancel={handleCancel} onRefund={handleRefundClick} />
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
