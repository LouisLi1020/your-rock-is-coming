/**
 * Open-Meteo 7-day forecast (no API key).
 * Geocode by area name, then fetch weather for that location.
 * https://open-meteo.com/en/docs
 */

const SYDNEY_LAT = -33.8688
const SYDNEY_LNG = 151.2093

export type DailyForecast = {
  date: string // YYYY-MM-DD
  tempMax: number
  tempMin: number
  weatherCode: number
  precipitationProbabilityMax: number
}

export type HourlyForecastItem = {
  time_iso: string
  date: string
  hour: number
  temp: number
  rain_prob: number
  weatherCode: number
}

export type WeatherForecast = {
  daily: DailyForecast[]
  /** Hourly data for all 7 days, grouped by date for lookup */
  hourlyByDate: Record<string, HourlyForecastItem[]>
  summary: string
  locationLabel?: string
}

const WMO_CODE_RAIN = [61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]

function isRainy(code: number): boolean {
  return WMO_CODE_RAIN.includes(code)
}

/** Geocode area name (e.g. "Chatswood", "Gordon") to lat/lng via Open-Meteo; prefer Australia. */
export async function geocodeArea(areaName: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const q = areaName.trim()
  if (!q) return null
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const results = data.results as Array<{ name: string; latitude: number; longitude: number; country_code?: string; admin1?: string }>
  if (!results?.length) return null
  const au = results.find((r) => r.country_code === 'AU')
  const first = au ?? results[0]
  const label = first.admin1 ? `${first.name}, ${first.admin1}` : first.name
  return { lat: first.latitude, lng: first.longitude, label }
}

async function fetchForecastAt(lat: number, lng: number, timezone = 'Australia/Sydney'): Promise<WeatherForecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=weathercode,temperature_2m,precipitation_probability&timezone=${encodeURIComponent(timezone)}&forecast_days=7`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather fetch failed')
  const data = await res.json()
  const daily = (data.daily.time as string[]).map((date: string, i: number) => ({
    date,
    tempMax: (data.daily.temperature_2m_max as number[])[i] ?? 0,
    tempMin: (data.daily.temperature_2m_min as number[])[i] ?? 0,
    weatherCode: (data.daily.weathercode as number[])[i] ?? 0,
    precipitationProbabilityMax: (data.daily.precipitation_probability_max as number[])[i] ?? 0,
  }))
  const hourlyByDate: Record<string, HourlyForecastItem[]> = {}
  const times = data.hourly?.time as string[] | undefined
  const temps = data.hourly?.temperature_2m as number[] | undefined
  const rainProbs = data.hourly?.precipitation_probability as number[] | undefined
  const codes = data.hourly?.weathercode as number[] | undefined
  if (times?.length) {
    for (let i = 0; i < times.length; i++) {
      const timeIso = times[i]
      const date = timeIso.slice(0, 10)
      if (!hourlyByDate[date]) hourlyByDate[date] = []
      hourlyByDate[date].push({
        time_iso: timeIso,
        date,
        hour: parseInt(timeIso.slice(11, 13), 10),
        temp: temps?.[i] ?? 0,
        rain_prob: rainProbs?.[i] ?? 0,
        weatherCode: codes?.[i] ?? 0,
      })
    }
  }
  const hasRain = daily.some((d) => isRainy(d.weatherCode) || d.precipitationProbabilityMax >= 50)
  const summary = hasRain ? 'Rain possible — check days below' : 'Good week ahead'
  return { daily, hourlyByDate, summary }
}

/** Fetch 7-day weather for Sydney (default). */
export async function fetchSydneyWeather(): Promise<WeatherForecast> {
  return fetchForecastAt(SYDNEY_LAT, SYDNEY_LNG)
}

/** Fetch 7-day weather for an area by name (e.g. "Chatswood", "Gordon"). Uses geocoding then forecast. */
export async function fetchWeatherByArea(areaName: string): Promise<WeatherForecast | null> {
  const loc = await geocodeArea(areaName)
  if (!loc) return null
  const forecast = await fetchForecastAt(loc.lat, loc.lng)
  forecast.locationLabel = loc.label
  return forecast
}

/** Emoji for WMO code (simplified) */
export function weatherEmoji(code: number, precipProb?: number): string {
  if (precipProb !== undefined && precipProb >= 60) return '🌧️'
  if (isRainy(code)) return '🌧️'
  if (code === 0) return '☀️'
  if (code === 1 || code === 2 || code === 3) return '⛅'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 95) return '⛈️'
  return '☀️'
}
