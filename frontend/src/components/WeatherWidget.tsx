import { useEffect, useState } from 'react'
import { fetchSydneyWeather, weatherEmoji, type WeatherForecast } from '../data/weather'
import { format, parseISO } from 'date-fns'

export function WeatherWidget() {
  const [data, setData] = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchSydneyWeather()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-g50 rounded-[20px] border border-g200 p-5">
        <div className="animate-pulse h-24 bg-white/50 rounded-xl" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="bg-g50 rounded-[20px] border border-g200 p-5">
        <p className="text-sm text-bark-lt">Weather unavailable</p>
      </div>
    )
  }

  const rainDay = data.daily.find(
    (d) => d.precipitationProbabilityMax >= 50 || [61, 63, 65, 80, 81, 82].includes(d.weatherCode)
  )

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-g600 uppercase tracking-wider">
            Sydney weather
          </span>
          <span className="text-[11px] bg-g50 text-g800 px-2.5 py-1 rounded-[20px] font-medium">
            {data.summary}
          </span>
        </div>
        <div className="flex gap-2">
          {data.daily.slice(0, 4).map((d, i) => {
            const isToday = i === 0
            return (
              <div
                key={d.date}
                className={`flex-1 text-center rounded-lg py-2 ${
                  isToday ? 'bg-g600 text-white' : 'bg-g50'
                }`}
              >
                <div className="text-[10px] font-medium opacity-90">
                  {isToday ? 'Today' : format(parseISO(d.date), 'EEE')}
                </div>
                <div className="text-base my-0.5">{weatherEmoji(d.weatherCode, d.precipitationProbabilityMax)}</div>
                <div className={`text-[11px] font-semibold ${isToday ? 'text-white' : 'text-g800'}`}>
                  {Math.round(d.tempMax)}°
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {rainDay && (
        <div className="bg-[#fff8ed] border border-[#f0d090] rounded-xl p-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-a50 flex items-center justify-center text-sm flex-shrink-0">
            🌧️
          </div>
          <div className="text-xs text-[#7a5a20] flex-1">
            <strong className="block text-[#5a3e10]">Rain likely {format(parseISO(rainDay.date), 'EEEE')}</strong>
            Consider indoor courts or reschedule
          </div>
          <a
            href="/bookings"
            className="bg-a400 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-90 whitespace-nowrap"
          >
            My bookings
          </a>
        </div>
      )}
    </div>
  )
}
