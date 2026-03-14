// src/api/courts.ts
import { apiFetch } from './client';

export type Court = {
  id: number;
  name: string;
  address: string;
  suburb: string;
  courts_count: number;
  surface: 'hard' | 'synthetic_grass';
  outdoor: number;
  lights: number;
  parking: number;
  open_hour: number;
  close_hour: number;
  price_per_hr: number;
  lights_price: number;
  phone: string;
  email: string;
  lat: number;
  lng: number;
};

export type AvailabilityGrid = {
  court_id: number;
  court_name: string;
  date: string;
  open_hour: number;
  close_hour: number;
  courts_count: number;
  surface: string;
  grid: Record<number, Record<number, 'available' | 'booked'>>;
};

type CourtsResponse = { success: boolean; count: number; courts: Court[] };
type CourtResponse = { success: boolean; court: Court };
type AvailResponse = { success: boolean } & AvailabilityGrid;

export async function getCourts(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<CourtsResponse>(`/courts${qs}`);
}

export async function getCourtById(id: number) {
  return apiFetch<CourtResponse>(`/courts/${id}`);
}

export async function getAvailability(id: number, date: string) {
  return apiFetch<AvailResponse>(`/courts/${id}/availability?date=${date}`);
}
