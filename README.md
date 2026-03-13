# 🎾 CourtFinder — Sydney Tennis Court Booking Platform

A full-stack web app for finding, comparing, and booking tennis courts across Sydney's North Shore.

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS + Leaflet.js (maps)
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Weather:** OpenWeatherMap API (free tier)
- **Map tiles:** CARTO Light

## Project Structure

```
courtfinder/
├── server.js              # Express API server
├── package.json
├── db/
│   ├── index.js           # Database access layer
│   ├── seed.js            # Schema + seed data
│   └── courtfinder.db     # SQLite database (auto-created)
├── public/
│   └── index.html         # Frontend SPA
└── README.md
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Initialize database with seed data
npm run seed

# 3. Start the server
npm start

# Server runs at http://localhost:3000
```

## Weather API Setup (Optional)

To enable real weather data, get a free API key from [OpenWeatherMap](https://openweathermap.org/api):

```bash
# Set environment variable before starting
OPENWEATHER_API_KEY=your_key_here npm start

# Or export it
export OPENWEATHER_API_KEY=your_key_here
npm start
```

Without a key, the app works normally — weather section just shows "Weather unavailable".

## API Endpoints

### Courts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courts` | List all courts (with filters) |
| GET | `/api/courts/:id` | Get single court |
| GET | `/api/courts/:id/availability?date=YYYY-MM-DD` | Get availability grid |

**Filter params for `/api/courts`:**
- `q` — search name/suburb/address
- `surface` — `hard` or `synthetic_grass`
- `lights` — `1` for courts with lights
- `parking` — `1` for courts with parking
- `min_courts` — minimum number of courts
- `suburb` — filter by suburb

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings?email=xxx` | Get bookings by email |
| DELETE | `/api/bookings/:id` | Cancel a booking |

**POST `/api/bookings` body:**
```json
{
  "court_id": 1,
  "court_number": 1,
  "date": "2026-03-15",
  "start_hour": 9,
  "end_hour": 11,
  "booker_name": "Alice Wang",
  "booker_phone": "0412345678",
  "booker_email": "alice@example.com",
  "players": 2
}
```

**DELETE `/api/bookings/:id` body:**
```json
{ "email": "alice@example.com" }
```

### Weather

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather/:courtId?date=YYYY-MM-DD` | Weather for one court |
| GET | `/api/weather/bulk?date=YYYY-MM-DD` | Weather for all courts |

## Features

- 🗺 **Three-panel layout:** Filters → Court List → Interactive Map
- 🔍 **Search & Filter:** By name, suburb, surface, lights, parking, court count
- 📅 **Availability Calendar:** Visual timeline for each court, per day
- 📝 **Booking System:** Full form with conflict detection
- 🚫 **Conflict Prevention:** Server-side check prevents double-booking
- 📋 **My Bookings:** View and cancel bookings by email
- ☁️ **Live Weather:** Real-time weather per court location (with caching)
- 💰 **Dynamic Pricing:** Auto-calculates lights fee for evening bookings
- 📱 **Responsive:** Works on desktop and tablet

## Database Schema

### `courts`
Stores all tennis court venues with location, facilities, and pricing.

### `bookings`
Stores all reservations. Has `status` field (`confirmed` / `cancelled`) for soft-delete cancellation.

### `weather_cache`
Caches OpenWeatherMap responses (3-hour TTL) to avoid excessive API calls.

## Seeded Data

- **12 courts** across Gordon, Pymble, Killara, St Ives, and Lindfield
- **~200 sample bookings** spread across the next 5 days
- All prices are $22/hr with $8/hr lights surcharge for evening bookings
