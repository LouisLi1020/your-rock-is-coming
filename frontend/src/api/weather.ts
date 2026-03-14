// src/api/weather.ts
import { apiFetch, ApiError } from './client';

export type WeatherData = {
  date: string;
  temp_min: number | null;
  temp_max: number | null;
  description: string;
  icon: string | null;
  rain_prob: number;
  wind_speed: number;
};

export type WeatherResponse = { success: boolean; source: string; weather: WeatherData | null };
type BulkWeatherResponse = { success: boolean; source: string; weather: Record<number, WeatherData> };

export async function getWeatherForCourt(courtId: number, date: string): Promise<WeatherResponse> {
  try {
    return await apiFetch<WeatherResponse>(`/weather/${courtId}?date=${date}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.message === 'Court not found')) {
      return { success: false, source: 'api', weather: null };
    }
    throw e;
  }
}

export async function getBulkWeather(date: string) {
  return apiFetch<BulkWeatherResponse>(`/weather/bulk?date=${date}`);
}

export type HourlyWeatherItem = {
  hour: number;
  time_iso: string;
  rain_prob: number;
  temp_c: number | null;
};
export type HourlyWeatherDay = { date: string; hourly: HourlyWeatherItem[] };
type HourlyWeatherResponse = {
  success: boolean;
  source: string;
  location_label: string;
  days: HourlyWeatherDay[];
};

export async function getHourlyWeather(courtId: number, date: string) {
  return apiFetch<HourlyWeatherResponse>(`/weather/${courtId}/hourly?date=${date}`);
}

/** Fetch hourly rain for a single day from Open-Meteo (no key). Use when you have lat/lng (e.g. venue). */
export async function fetchHourlyRainByCoords(
  lat: number,
  lng: number,
  dateStr: string,
  locationLabel?: string
): Promise<{ location_label: string; days: HourlyWeatherDay[] }> {
  const selected = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromToday = Math.max(0, Math.ceil((selected.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
  const forecastDays = Math.min(16, Math.max(3, daysFromToday + 3));
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation_probability,temperature_2m&timezone=Australia/Sydney&forecast_days=${forecastDays}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  if (data.error) throw new Error(data.reason || 'Weather API error');
  const times = data.hourly?.time as string[] | undefined;
  const probs = data.hourly?.precipitation_probability as number[] | undefined;
  const temps = data.hourly?.temperature_2m as number[] | undefined;
  const byDate: Record<string, HourlyWeatherItem[]> = {};
  if (times?.length) {
    for (let i = 0; i < times.length; i++) {
      const iso = times[i];
      const d = iso.slice(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push({
        hour: parseInt(iso.slice(11, 13), 10),
        time_iso: iso,
        rain_prob: probs?.[i] ?? 0,
        temp_c: temps?.[i] != null ? Math.round(temps[i] * 10) / 10 : null,
      });
    }
  }
  const days: HourlyWeatherDay[] = [];
  for (let offset = 0; offset < 3; offset++) {
    const d = new Date(selected);
    d.setDate(d.getDate() + offset);
    const dStr = d.toISOString().slice(0, 10);
    days.push({ date: dStr, hourly: byDate[dStr] || [] });
  }
  return {
    location_label: locationLabel ?? 'Sydney',
    days,
  };
}

export function weatherEmoji(icon: string | null): string {
  if (!icon) return '🌤';
  if (icon.includes('01')) return '☀️';
  if (icon.includes('02')) return '⛅';
  if (icon.includes('03') || icon.includes('04')) return '☁️';
  if (icon.includes('09') || icon.includes('10')) return '🌧';
  if (icon.includes('11')) return '⛈';
  if (icon.includes('13')) return '❄️';
  return '🌤';
}
