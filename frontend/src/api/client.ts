// src/api/client.ts
const BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const contentType = res.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await res.json() : {};
  if (!res.ok) {
    const message = (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string')
      ? data.error
      : res.statusText || 'Request failed';
    throw new ApiError(message, res.status);
  }
  return data as T;
}
