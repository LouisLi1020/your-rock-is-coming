/**
 * Open-Meteo 7-day forecast for Sydney (no API key).
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

export type WeatherForecast = {
  daily: DailyForecast[]
  /** e.g. "Good week ahead" or "Rain likely Sunday" */
  summary: string
}

const WMO_CODE_RAIN = [61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]

function isRainy(code: number): boolean {
  return WMO_CODE_RAIN.includes(code)
}

export async function fetchSydneyWeather(): Promise<WeatherForecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${SYDNEY_LAT}&longitude=${SYDNEY_LNG}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Australia%2FSydney&forecast_days=7`
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
  const hasRain = daily.some((d) => isRainy(d.weatherCode) || d.precipitationProbabilityMax >= 50)
  const summary = hasRain ? 'Rain possible — check days below' : 'Good week ahead'
  return { daily, summary }
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
