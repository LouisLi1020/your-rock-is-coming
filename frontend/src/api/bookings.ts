// src/api/bookings.ts
import { apiFetch } from './client';

export type Booking = {
  id: number;
  court_id: number;
  court_number: number;
  date: string;
  start_hour: number;
  end_hour: number;
  booker_name: string;
  booker_phone: string;
  booker_email: string;
  players: number;
  total_price: number;
  status: 'confirmed' | 'cancelled' | 'refunded';
  created_at: string;
  // joined fields
  court_name?: string;
  court_address?: string;
  surface?: string;
};

type BookingsResponse = { success: boolean; count: number; bookings: Booking[] };
type BookingCreateResponse = { success: boolean; booking: Booking; error?: string };
type ActionResponse = { success: boolean; message?: string; error?: string; refund_amount?: number };

export type CreateBookingPayload = {
  court_id: number;
  court_number: number;
  date: string;
  start_hour: number;
  end_hour: number;
  booker_name: string;
  booker_phone: string;
  booker_email: string;
  players: number;
};

export async function getBookings(email: string) {
  return apiFetch<BookingsResponse>(`/bookings?email=${encodeURIComponent(email)}`);
}

export async function createBooking(data: CreateBookingPayload) {
  return apiFetch<BookingCreateResponse>('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function cancelBooking(id: number, email: string) {
  return apiFetch<ActionResponse>(`/bookings/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ email }),
  });
}

export async function refundBooking(id: number, email: string) {
  return apiFetch<ActionResponse>(`/bookings/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
