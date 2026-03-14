# your·rock·is·coming — Sydney Tennis Platform

Find and book tennis courts across Sydney. One place to discover venues, check weather, and book — rain or shine.

**UniHack 2026**

---

## Tech stack

| Layer   | Stack |
|--------|--------|
| **Frontend** | React 18, TypeScript, Vite 8, Tailwind CSS, Leaflet / react-leaflet, react-router-dom |
| **Backend**  | Node.js, Express, SQLite (better-sqlite3) |
| **APIs**     | Open-Meteo (weather, no key), optional OpenWeatherMap for backend |

---

## Quick start

### Option A: Full stack (frontend + backend)

From repo root:

```bash
npm install
npm run seed    # optional: seed DB (or npm run migrate)
npm run dev:all
```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:3001  

The frontend proxies `/api` to the backend. Bookings and courts come from the API (and SQLite).

### Option B: Frontend only

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. The app uses **mock venue data** and **localStorage** for bookings when the backend is not running (no need to start the server).

---

## Project structure

```
├── frontend/           # React SPA (main app)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/   # Nav, Hero, VenueCard, VenueMap, QuickBookModal, WeatherWidget, …
│   │   ├── pages/        # Home, MapPage, BookingsPage, CalendarBookPage, VenueDetail, …
│   │   ├── api/          # courts, bookings, weather client
│   │   ├── data/         # venues type, mock data, booking helpers
│   │   ├── hooks/        # useCourtsAsVenues, useFilteredVenues
│   │   └── context/      # BookingContext
│   ├── index.html
│   └── vite.config.ts   # dev port 3000, proxy /api → localhost:3001
├── server.js            # Express API
├── db/                  # SQLite (schema, seed, migrate)
├── package.json         # backend deps + scripts (dev, dev:all, seed, migrate)
└── README.md
```

- **Backend** serves the built frontend via `express.static('frontend/dist')`; run `npm run build` in `frontend/` before deploying.

---

## Features

- **Discover** — Search, filter chips (surface, indoor/outdoor, facilities), venue cards, stats
- **Map** — Sydney map with markers; click for venue popup and “View details”
- **Venue detail** — Full page per venue; “Quick book” opens modal (date, time, 7-day weather)
- **Book** (`/book`) — Pick venue, date (calendar), time slot; 7-day weather; submit booking
- **Schedule** (`/bookings`) — List and cancel bookings (API or localStorage when backend is off)
- **Profile** (`/profile`) — Demo user / contact info for confirmations
- **Weather** — 7-day forecast in hero, quick book, and calendar book; rain warning when relevant

---

## Backend API

### Courts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courts` | List courts (optional: `q`, `surface`, `lights`, `parking`, `toilet`, `min_courts`, `suburb`) |
| GET | `/api/courts/:id` | Single court |
| GET | `/api/courts/:id/availability?date=YYYY-MM-DD` | Availability grid |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings?email=xxx` | List by email |
| DELETE | `/api/bookings/:id` | Cancel booking |

### Weather

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather/:courtId?date=YYYY-MM-DD` | Weather for one court |
| GET | `/api/weather/bulk?date=YYYY-MM-DD` | Weather for all courts |

Optional: set `OPENWEATHER_API_KEY` for live weather; otherwise backend returns fallback data.

---

## Scripts (root)

| Script | Description |
|--------|-------------|
| `npm start` | Backend only, port 3000 |
| `npm run dev` | Backend only, port **3001** (for dev:all) |
| `npm run dev:frontend` | Frontend dev (port 3000) |
| `npm run dev:all` | Backend (3001) + frontend (3000) |
| `npm run seed` | Seed SQLite DB |
| `npm run migrate` | Run DB migrations |

---

## Vision

One platform for Sydney tennis: venues, booking, opening hours, weather-aware flows. See repo history and any docs in `docs/` for roadmap and design notes.
