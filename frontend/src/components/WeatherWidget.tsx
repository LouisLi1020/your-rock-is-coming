import { useState, useCallback, useEffect, useRef } from 'react'
import { fetchSydneyWeather, fetchWeatherByArea, weatherEmoji, type WeatherForecast } from '../data/weather'
import { format, parseISO } from 'date-fns'

const DEFAULT_AREA = 'Sydney'

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

interface WeatherWidgetProps {
  /** Suburb list for autocomplete, passed from parent */
  suburbs?: string[]
}

export function WeatherWidget({ suburbs = [] }: WeatherWidgetProps) {
  const [areaInput, setAreaInput] = useState(DEFAULT_AREA)
  const [data, setData] = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastSearched, setLastSearched] = useState(DEFAULT_AREA)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Dedupe + sort suburbs
  const uniqueSuburbs = [...new Set(suburbs)].sort()

  // Filter suggestions based on input
  const suggestions =
    areaInput.trim().length > 0 && areaInput !== lastSearched
      ? uniqueSuburbs.filter((s) => s.toLowerCase().includes(areaInput.toLowerCase()))
      : []

  const loadWeather = useCallback((area: string) => {
    const q = area.trim() || DEFAULT_AREA
    setLoading(true)
    setError(false)
    setSelectedDate(null)
    const fetchFn = q.toLowerCase() === 'sydney' ? fetchSydneyWeather() : fetchWeatherByArea(q)
    fetchFn
      .then((forecast) => {
        if (forecast) {
          setData(forecast)
          setLastSearched(forecast.locationLabel ?? q)
        } else {
          setError(true)
          setData(null)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadWeather(DEFAULT_AREA)
  }, [loadWeather])

  const handleSubmit = useCallback(() => {
    setShowDropdown(false)
    loadWeather(areaInput)
  }, [areaInput, loadWeather])

  const handleSelect = useCallback(
    (suburb: string) => {
      setAreaInput(suburb)
      setShowDropdown(false)
      loadWeather(suburb)
    },
    [loadWeather]
  )

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] p-4">
        <div className="animate-pulse h-10 rounded-lg bg-g50 mb-3 w-3/4" />
        <div className="animate-pulse h-20 rounded-lg bg-g50" />
      </div>
    )
  }

  const hourlyForSelected = selectedDate && data?.hourlyByDate?.[selectedDate] ? data.hourlyByDate[selectedDate] : []

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-[var(--border)] p-4">
        {/* Search bar with autocomplete */}
        <div ref={wrapperRef} className="relative mb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[120px]">
              <input
                type="text"
                value={areaInput}
                onChange={(e) => {
                  setAreaInput(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => {
                  if (areaInput.trim() && areaInput !== lastSearched) setShowDropdown(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowDropdown(false)
                    handleSubmit()
                  }
                  if (e.key === 'Escape') setShowDropdown(false)
                }}
                placeholder="e.g. Chatswood, Gordon"
                className="w-full px-3 py-1.5 text-[13px] border border-[var(--border)] rounded-lg focus:border-g600 focus:ring-2 focus:ring-g200 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-3 py-1.5 bg-g600 text-white text-[12px] font-semibold rounded-lg hover:bg-g800 disabled:opacity-60"
            >
              {loading ? '…' : 'Update'}
            </button>
          </div>

          {/* Suburb autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-xl shadow-lg z-[3000] max-h-[180px] overflow-y-auto py-1">
              {suggestions.slice(0, 8).map((suburb) => {
                const idx = suburb.toLowerCase().indexOf(areaInput.toLowerCase())
                const before = suburb.slice(0, idx)
                const match = suburb.slice(idx, idx + areaInput.length)
                const after = suburb.slice(idx + areaInput.length)
                return (
                  <button
                    key={suburb}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(suburb)}
                    className="w-full text-left px-3 py-1.5 text-[12px] text-bark hover:bg-[var(--cream)] transition-colors flex items-center gap-1.5"
                  >
                    <svg
                      className="w-3 h-3 text-bark-lt flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      {before}
                      <strong className="font-semibold text-g600">{match}</strong>
                      {after}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {loading && <div className="animate-pulse h-16 bg-g50 rounded-lg mb-2" />}
        {!loading && (error || !data) && (
          <p className="text-sm text-bark-lt py-2">Weather unavailable for this area. Try another name.</p>
        )}
        {!loading && data && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-g600 uppercase tracking-wider">
                {data.locationLabel ?? lastSearched}
              </span>
              <span className="text-[11px] bg-g50 text-g800 px-2.5 py-1 rounded-[20px] font-medium">{data.summary}</span>
            </div>
            {/* 7-day strip */}
            <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin">
              <div className="flex gap-2 min-w-max pb-1">
                {data.daily.map((d, i) => {
                  const isToday = i === 0
                  const isSelected = selectedDate === d.date
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(isSelected ? null : d.date)}
                      className={`flex-shrink-0 w-[72px] text-center rounded-lg py-2.5 transition-colors ${
                        isSelected
                          ? 'ring-2 ring-g600 ring-offset-2 bg-g100'
                          : isToday
                            ? 'bg-g600 text-white'
                            : 'bg-g50 hover:bg-g100 text-bark'
                      }`}
                    >
                      <div className="text-[10px] font-medium opacity-90">
                        {isToday ? 'Today' : format(parseISO(d.date), 'EEE')}
                      </div>
                      <div className="text-base my-0.5">
                        {weatherEmoji(d.weatherCode, d.precipitationProbabilityMax)}
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${isToday && !isSelected ? 'text-white' : 'text-g800'}`}
                      >
                        {Math.round(d.tempMax)}°
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Hourly detail for selected day */}
            {selectedDate && hourlyForSelected.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <div className="text-[10px] font-semibold text-bark-lt uppercase tracking-wider mb-2">
                  {format(parseISO(selectedDate), 'EEEE d MMM')} — hourly
                </div>
                <div className="overflow-x-auto -mx-1 px-1">
                  <div className="flex gap-2 min-w-max pb-1">
                    {hourlyForSelected.map((h) => (
                      <div
                        key={h.time_iso}
                        className="flex-shrink-0 w-[56px] text-center rounded-lg bg-[var(--cream)] border border-[var(--border)] py-2"
                      >
                        <div className="text-[10px] font-medium text-bark-lt">{formatHourLabel(h.hour)}</div>
                        <div className="text-sm my-0.5">{weatherEmoji(h.weatherCode, h.rain_prob)}</div>
                        <div className="text-[11px] font-semibold text-bark">{Math.round(h.temp)}°</div>
                        <div
                          className={`text-[10px] ${h.rain_prob >= 50 ? 'text-amber-600 font-medium' : 'text-bark-lt'}`}
                        >
                          {h.rain_prob}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
