import { useState, useEffect, useCallback } from 'react'
import { Nav } from '../components/Nav'
import { Link, useSearchParams } from 'react-router-dom'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { getAvailability } from '../api/courts'
import type { AvailabilityGrid } from '../api/courts'
import { fetchHourlyRainByCoords } from '../api/weather'
import type { HourlyWeatherDay } from '../api/weather'
import { useCourtsAsVenues } from '../hooks/useCourtsAsVenues'
import { useBooking, DEMO_USER } from '../context/BookingContext'
import toast from 'react-hot-toast'

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function formatDateDisplay(d: Date): string {
  return format(d, 'EEE, d MMM yyyy')
}

export function CalendarBookPage() {
  const [searchParams] = useSearchParams()
  const courtFromUrl = searchParams.get('court')
  const { venues } = useCourtsAsVenues()

  const [venueId, setVenueId] = useState<string>('')
  const [calDate, setCalDate] = useState(() => new Date())
  const [calAvail, setCalAvail] = useState<AvailabilityGrid | null>(null)
  const [calLoading, setCalLoading] = useState(false)
  /** Hourly weather for 3 days (Open-Meteo), with location label */
  const [weatherLocation, setWeatherLocation] = useState<string>('')
  const [weatherDays, setWeatherDays] = useState<HourlyWeatherDay[]>([])
  const [hourlyWeatherLoading, setHourlyWeatherLoading] = useState(false)
  /** Picked slots: key = "courtNum-hour", value = true */
  const [calPicked, setCalPicked] = useState<Record<string, boolean>>({})

  const [formDate, setFormDate] = useState('')
  const [formCourt, setFormCourt] = useState(1)
  const [formFrom, setFormFrom] = useState(8)
  const [formTo, setFormTo] = useState(9)
  const [formName, setFormName] = useState(DEMO_USER.name)
  const [formPlayers, setFormPlayers] = useState(2)
  const [formPhone, setFormPhone] = useState(DEMO_USER.phone)
  const [formEmail, setFormEmail] = useState(DEMO_USER.email)

  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookSuccess, setBookSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const venue = venueId ? venues.find((v) => v.id === venueId) : undefined
  const { addBooking } = useBooking()

  useEffect(() => {
    if (venues.length > 0 && !venueId) setVenueId(venues[0].id)
  }, [venues, venueId])

  useEffect(() => {
    if (courtFromUrl && venues.some((v) => v.id === courtFromUrl)) setVenueId(courtFromUrl)
  }, [courtFromUrl, venues])

  useEffect(() => {
    if (!venue) {
      setCalAvail(null)
      return
    }
    const cid = Number(venue.id)
    if (Number.isNaN(cid)) {
      setCalAvail(null)
      return
    }
    const dateStr = format(calDate, 'yyyy-MM-dd')
    setCalLoading(true)
    getAvailability(cid, dateStr)
      .then((res) => {
        if (res && res.grid) setCalAvail(res as AvailabilityGrid)
        else setCalAvail(null)
      })
      .catch(() => setCalAvail(null))
      .finally(() => setCalLoading(false))
  }, [venue, calDate])

  useEffect(() => {
    if (!venue) {
      setWeatherLocation('')
      setWeatherDays([])
      return
    }
    const dateStr = format(calDate, 'yyyy-MM-dd')
    setHourlyWeatherLoading(true)
    fetchHourlyRainByCoords(venue.lat, venue.lng, dateStr, venue.suburb ? `${venue.suburb}, Sydney` : undefined)
      .then((res) => {
        setWeatherLocation(res.location_label)
        setWeatherDays(res.days)
      })
      .catch(() => {
        setWeatherLocation('')
        setWeatherDays([])
      })
      .finally(() => setHourlyWeatherLoading(false))
  }, [venue, calDate])

  useEffect(() => {
    if (!venue) return
    setFormDate(format(calDate, 'yyyy-MM-dd'))
    const count = venue.courts ?? 1
    if (formCourt > count) setFormCourt(1)
    const open = venue.open_hour ?? 7
    const close = venue.close_hour ?? 22
    if (formFrom < open || formFrom >= close) setFormFrom(open)
    if (formTo <= formFrom || formTo > close) setFormTo(formFrom + 1)
  }, [venue, calDate])

  const handleCalPrev = useCallback(() => {
    setCalDate((d) => subDays(d, 1))
    setCalPicked({})
  }, [])
  const handleCalNext = useCallback(() => {
    setCalDate((d) => addDays(d, 1))
    setCalPicked({})
  }, [])

  const handleSlotClick = useCallback((courtNum: number, hour: number) => {
    if (!calAvail?.grid[courtNum]) return
    if (calAvail.grid[courtNum][hour] === 'booked') return
    const key = `${courtNum}-${hour}`
    setCalPicked((prev) => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = true
      return next
    })
  }, [calAvail])

  const syncPickToForm = useCallback(() => {
    const keys = Object.keys(calPicked).filter((k) => calPicked[k])
    if (keys.length === 0) return
    const courtNum = parseInt(keys[0].split('-')[0], 10)
    const hours = keys
      .filter((k) => k.startsWith(`${courtNum}-`))
      .map((k) => parseInt(k.split('-')[1], 10))
      .sort((a, b) => a - b)
    if (hours.length === 0) return
    setFormCourt(courtNum)
    setFormFrom(hours[0])
    setFormTo(hours[hours.length - 1] + 1)
    setFormDate(format(calDate, 'yyyy-MM-dd'))
  }, [calPicked, calDate])

  useEffect(() => {
    syncPickToForm()
  }, [syncPickToForm])

  const openHour = venue?.open_hour ?? 7
  const closeHour = venue?.close_hour ?? 22
  const pricePerHr = venue?.price_per_hr ?? 0
  const lightsPrice = venue?.lights_price ?? 0
  const hasLights = venue?.nightLighting ?? false

  const duration = Math.max(0, formTo - formFrom)
  const courtFee = duration * pricePerHr
  const lightsHours = hasLights && (formFrom >= 18 || formTo > 18)
    ? Math.max(0, formTo - Math.max(formFrom, 18))
    : 0
  const lightsFee = lightsHours * lightsPrice
  const total = courtFee + lightsFee

  const canSubmit =
    duration > 0 &&
    formDate &&
    formName.trim() !== '' &&
    formPhone.trim() !== '' &&
    formEmail.trim() !== ''

  const handleSubmit = async () => {
    if (!venue || !canSubmit) return
    setFormError('')
    setSubmitting(true)
    const payload = {
      court_id: Number(venue.id),
      court_number: formCourt,
      date: formDate,
      start_hour: formFrom,
      end_hour: formTo,
      booker_name: formName.trim(),
      booker_phone: formPhone.trim(),
      booker_email: formEmail.trim(),
      players: formPlayers,
    }
    const result = await addBooking(payload)
    setSubmitting(false)
    if (result.success) {
      const surfaceLabel = venue.surface_api === 'synthetic_grass' ? 'Synthetic' : 'Hard'
      setSuccessMessage(
        `${venue.name} · ${surfaceLabel} court ${formCourt} · ${formDate} · ${formatHour(formFrom)} – ${formatHour(formTo)} · Total $${total}. Confirmation sent to ${formEmail}.`
      )
      setBookSuccess(true)
      toast.success('Booking confirmed')
    } else {
      setFormError(result.error ?? 'Booking failed')
    }
  }

  if (bookSuccess) {
    return (
      <div className="min-h-screen bg-sand flex flex-col">
        <Nav />
        <div className="max-w-lg mx-auto w-full px-4 sm:px-6 py-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="font-lora text-2xl font-semibold text-bark mb-2">Booking confirmed</h1>
          <p className="text-sm text-bark-lt whitespace-pre-line mb-6">{successMessage}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/book"
              className="px-5 py-2.5 border border-[var(--border)] rounded-xl text-bark font-medium hover:bg-g50"
              onClick={() => { setBookSuccess(false); setSuccessMessage('') }}
            >
              Book another
            </Link>
            <Link to="/" className="px-5 py-2.5 bg-g600 text-white font-semibold rounded-xl hover:bg-g800">
              Back to Discover
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const hourOptions: number[] = []
  for (let h = openHour; h < closeHour; h++) hourOptions.push(h)
  const toOptions: number[] = []
  for (let h = formFrom + 1; h <= closeHour; h++) toOptions.push(h)

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <Nav />
      <nav className="bg-white border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 text-sm text-bark-lt">
          <Link to="/" className="text-g600 hover:underline">Discover</Link>
          <span className="mx-2">/</span>
          <span className="text-bark">Book a court</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        <h1 className="font-lora text-2xl font-semibold text-bark mb-1">Book a court</h1>
        <p className="text-sm text-bark-lt mb-6">Choose venue, pick a date and time on the timeline, then fill your details.</p>

        <div className="mb-6">
          <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-2">Venue</label>
          <select
            value={venueId}
            onChange={(e) => { setVenueId(e.target.value); setCalPicked({}) }}
            className="w-full max-w-md px-4 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-bark font-medium focus:border-g600 focus:ring-2 focus:ring-green-dim outline-none"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
            {venues.length === 0 && <option value="">Loading venues…</option>}
          </select>
        </div>

        {!venue && (
          <p className="text-bark-lt text-sm">Select a venue to see availability.</p>
        )}

        {venue && (
          <>
            {/* ═══ Availability (index-style timeline) ═══ */}
            <section className="bg-white rounded-[14px] border border-[var(--border)] p-5 mb-8">
              <h2 className="text-sm font-semibold text-bark mb-4">📅 Availability</h2>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCalPrev}
                    className="w-8 h-8 rounded-lg bg-[var(--cream)] border border-[var(--border)] flex items-center justify-center text-bark-lt hover:border-g600 hover:text-g600"
                  >
                    ‹
                  </button>
                  <span className="font-semibold text-bark min-w-[200px] text-center">
                    {formatDateDisplay(calDate)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCalNext}
                    className="w-8 h-8 rounded-lg bg-[var(--cream)] border border-[var(--border)] flex items-center justify-center text-bark-lt hover:border-g600 hover:text-g600"
                  >
                    ›
                  </button>
                </div>
                <div className="flex gap-4 text-[11px] text-bark-lt font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-2.5 rounded bg-green-dim border border-green-300/50" /> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-2.5 rounded border border-red-200/50"
                      style={{ background: 'repeating-linear-gradient(135deg, rgba(224,90,90,0.12), rgba(224,90,90,0.12) 3px, rgba(224,90,90,0.04) 3px, rgba(224,90,90,0.04) 6px)' }}
                    /> Booked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-2.5 rounded bg-[var(--accent)] border border-[var(--accent-hover)]" /> Selected
                  </span>
                </div>
              </div>

              {calLoading ? (
                <p className="text-center py-8 text-bark-lt text-sm">Loading availability…</p>
              ) : calAvail?.grid ? (
                <div className="space-y-4">
                  {/* Rain chance row: same width per hour as court timelines, aligned with time */}
                  {(() => {
                    const selectedDayStr = format(calDate, 'yyyy-MM-dd')
                    const selectedDayData = weatherDays.find((d) => d.date === selectedDayStr)
                    const hourlies = selectedDayData?.hourly ?? []
                    const getRainForHour = (hr: number) => {
                      const exact = hourlies.find((x) => x.hour === hr)
                      if (exact != null) return exact.rain_prob
                      const sorted = [...hourlies].sort((a, b) => b.hour - a.hour)
                      const slot = sorted.find((x) => x.hour <= hr)
                      return slot?.rain_prob ?? null
                    }
                    return (
                      <div className="border border-[var(--border)] rounded-[14px] p-3 sm:p-4">
                        <div className="text-[13px] font-semibold text-bark mb-2 flex items-center gap-2">
                          Rain chance
                          {weatherLocation && (
                            <span className="text-[11px] font-normal text-bark-lt">— {weatherLocation}</span>
                          )}
                        </div>
                        {hourlyWeatherLoading ? (
                          <div className="flex h-8 items-center text-xs text-bark-lt">Loading…</div>
                        ) : (
                          <div className="flex h-8 bg-sky-50/80 rounded-lg overflow-hidden border border-sky-200/60">
                            {hourOptions.map((hr) => {
                              const rain = getRainForHour(hr)
                              const pct = rain != null ? `${rain}%` : '–'
                              const high = rain != null && rain >= 50
                              return (
                                <div
                                  key={hr}
                                  className="flex-1 border-r border-sky-200/60 last:border-r-0 flex items-center justify-center min-w-0"
                                  title={`${formatHour(hr)} – ${formatHour(hr + 1)}: ${pct} rain`}
                                >
                                  <span className={`text-[10px] font-medium truncate ${high ? 'text-amber-600' : 'text-bark-lt'}`}>
                                    {pct}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
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
                  })()}
                  {Array.from({ length: calAvail.courts_count }, (_, i) => i + 1).map((courtNum) => {
                    const surfaceLabel = calAvail.surface === 'synthetic_grass' ? 'Synthetic grass' : 'Hard court'
                    return (
                      <div
                        key={courtNum}
                        className="border border-[var(--border)] rounded-[14px] p-3 sm:p-4"
                      >
                        <div className="text-[13px] font-semibold text-bark mb-2">
                          {surfaceLabel} court {courtNum}
                        </div>
                        <div className="flex h-8 bg-[var(--cream)] rounded-lg overflow-hidden border border-[var(--border-light)]">
                          {hourOptions.map((hr) => {
                            const booked = calAvail.grid[courtNum]?.[hr] === 'booked'
                            const picked = !!calPicked[`${courtNum}-${hr}`]
                            let cls = 'flex-1 border-r border-[var(--border-light)] last:border-r-0 cursor-pointer transition-colors '
                            if (booked) cls += 'cursor-not-allowed '
                            if (booked) cls += 'opacity-80 '
                            if (picked) cls += 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] '
                            else if (!booked) cls += 'hover:bg-g50 '
                            if (booked) {
                              cls += 'bg-repeat'
                              cls += ' '
                            }
                            return (
                              <button
                                key={hr}
                                type="button"
                                disabled={booked}
                                title={`${formatHour(hr)} – ${formatHour(hr + 1)}${booked ? ' (Booked)' : ''}`}
                                className={cls}
                                style={booked ? { backgroundImage: 'repeating-linear-gradient(135deg, rgba(224,90,90,0.12), rgba(224,90,90,0.12) 3px, rgba(224,90,90,0.04) 3px, rgba(224,90,90,0.04) 6px)' } : undefined}
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
              ) : (
                <p className="text-bark-lt text-sm py-4">No availability data for this date.</p>
              )}
            </section>

            {/* ═══ Book form (index-style fields + summary) ═══ */}
            <section className="bg-white rounded-[14px] border border-[var(--border)] p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-bark mb-4">📝 Book now</h2>

              {formError && (
                <div className="mb-4 p-3 rounded-[10px] bg-red-50 border border-red-200/50 text-[#B83030] text-[13px]">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-1">Date</label>
                    <input
                      type="date"
                      value={formDate}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => { setFormDate(e.target.value); setCalDate(parseISO(e.target.value)); setCalPicked({}) }}
                      className="w-full px-3 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-[13px] text-bark focus:border-g600 focus:ring-2 focus:ring-green-dim outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-1">Court</label>
                    <select
                      value={formCourt}
                      onChange={(e) => setFormCourt(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-[13px] text-bark focus:border-g600 focus:ring-2 focus:ring-green-dim outline-none appearance-none bg-no-repeat bg-[length:12px] bg-[right_12px_center] pr-9"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")" }}
                    >
                      {Array.from({ length: venue.courts ?? 1 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {(venue.surface_api === 'synthetic_grass' ? 'Synthetic' : 'Hard')} court {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-1">From</label>
                    <select
                      value={formFrom}
                      onChange={(e) => { setFormFrom(Number(e.target.value)); if (formTo <= Number(e.target.value)) setFormTo(Number(e.target.value) + 1) }}
                      className="w-full px-3 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-[13px] text-bark focus:border-g600 focus:ring-2 focus:ring-green-dim outline-none appearance-none bg-no-repeat bg-[length:12px] bg-[right_12px_center] pr-9"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")" }}
                    >
                      {hourOptions.map((h) => (
                        <option key={h} value={h}>{formatHour(h)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-1">To</label>
                    <select
                      value={formTo}
                      onChange={(e) => setFormTo(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-[13px] text-bark focus:border-g600 focus:ring-2 focus:ring-green-dim outline-none appearance-none bg-no-repeat bg-[length:12px] bg-[right_12px_center] pr-9"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")" }}
                    >
                      {toOptions.map((h) => (
                      <option key={h} value={h}>{formatHour(h)}</option>
                    ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-1">Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-[13px] text-bark placeholder:text-bark-lt/60 focus:border-g600 focus:ring-2 focus:ring-green-dim outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-1">Players</label>
                    <select
                      value={formPlayers}
                      onChange={(e) => setFormPlayers(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-[13px] text-bark focus:border-g600 focus:ring-2 focus:ring-green-dim outline-none appearance-none bg-no-repeat bg-[length:12px] bg-[right_12px_center] pr-9"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")" }}
                    >
                      {[2, 3, 4].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="04XX XXX XXX"
                      className="w-full px-3 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-[13px] text-bark placeholder:text-bark-lt/60 focus:border-g600 focus:ring-2 focus:ring-green-dim outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-bark-lt uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-3 py-2.5 bg-[var(--cream)] border border-[var(--border)] rounded-[10px] text-[13px] text-bark placeholder:text-bark-lt/60 focus:border-g600 focus:ring-2 focus:ring-green-dim outline-none"
                    />
                  </div>
                </div>

                <div className="bg-[var(--cream)] border border-[var(--border)] rounded-[14px] p-4 mt-2">
                  <h4 className="text-[12px] font-semibold text-bark-lt uppercase tracking-wider mb-3">Summary</h4>
                  <div className="flex justify-between text-[13px] text-bark-lt">
                    <span>Court</span>
                    <b className="text-bark">{(venue.surface_api === 'synthetic_grass' ? 'Synthetic' : 'Hard')} court {formCourt}</b>
                  </div>
                  <div className="flex justify-between text-[13px] text-bark-lt">
                    <span>Date</span>
                    <b className="text-bark">{formDate || '–'}</b>
                  </div>
                  <div className="flex justify-between text-[13px] text-bark-lt">
                    <span>Time</span>
                    <b className="text-bark">{formatHour(formFrom)} – {formatHour(formTo)}</b>
                  </div>
                  <div className="flex justify-between text-[13px] text-bark-lt">
                    <span>Duration</span>
                    <b className="text-bark">{duration} hr{duration !== 1 ? 's' : ''}</b>
                  </div>
                  <div className="flex justify-between text-[13px] text-bark-lt">
                    <span>Court fee</span>
                    <b className="text-bark">${courtFee}</b>
                  </div>
                  {lightsFee > 0 && (
                    <div className="flex justify-between text-[13px] text-bark-lt">
                      <span>Lights</span>
                      <b className="text-bark">${lightsFee}</b>
                    </div>
                  )}
                  <div className="flex justify-between text-[17px] font-bold text-g600 pt-3 mt-3 border-t border-[var(--border)]">
                    <span>Total</span>
                    <span>${total}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canSubmit || submitting}
                  onClick={handleSubmit}
                  className="w-full py-3 mt-2 bg-[var(--accent)] text-bark font-bold text-[14px] rounded-[10px] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Confirm Booking →'}
                </button>
              </div>
            </section>
          </>
        )}

        <p className="text-sm text-bark-lt mt-6">
          <Link to="/" className="text-g600 font-medium hover:underline">← Back to Discover</Link>
        </p>
      </div>
    </div>
  )
}
