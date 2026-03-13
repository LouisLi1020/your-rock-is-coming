# your·rock·is·coming — Sydney Tennis Platform

Find and book tennis courts across Sydney. One place to discover venues, check weather, and book — rain or shine.

---

## Frontend (React) — Demo

The main demo is a **React + Vite** SPA with map, filters, quick book, and 7-day weather.

### Tech stack

- **React 18** + **TypeScript** + **Vite 8**
- **Tailwind CSS** — design tokens (Lora, Plus Jakarta Sans, sand/bark/green palette)
- **Leaflet** + **react-leaflet** — interactive Sydney map
- **Open-Meteo API** — 7-day weather (no API key)
- **react-hot-toast** — notifications
- **date-fns** — calendar and dates

### Quick start

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### Features (demo)

- **Discover** — Hero search, filter chips (surface, indoor/outdoor), venue cards with summary, stats row
- **Map** — Interactive map; click markers to select venues; popup with “View details”
- **Venue cards** — “View detail” (full venue page) and “Quick book” (modal: date + time slot + 7-day weather)
- **Book by calendar** (`/book`) — Pick venue, date from month calendar, then time slot; 7-day weather shown
- **7-day weather** — Sydney forecast in Hero, Quick book modal, and Calendar book; rain warning when precipitation is likely
- **My Bookings** (`/bookings`) — List and cancel bookings (stored in `localStorage`)
- **Profile** (`/profile`) — Optional email for confirmations
- **Toasts** — Success messages on book and profile save

### Frontend structure

```
frontend/
├── index.html
├── src/
│   ├── App.tsx              # Routes
│   ├── main.tsx
│   ├── styles.css           # Tailwind + tokens
│   ├── components/          # Nav, Hero, VenueCard, VenueMap, QuickBookModal, WeatherWidget, …
│   ├── pages/               # Home, MapPage, BookingsPage, ProfilePage, CalendarBookPage, VenueDetail, BookCourt
│   ├── data/                # venues.ts, booking.ts, weather.ts
│   ├── hooks/               # useFilteredVenues
│   └── context/             # BookingContext (bookings + guest email)
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Backend (optional)

A **Node.js + Express + SQLite** API exists at repo root for a full-stack setup (courts CRUD, bookings, weather proxy).

### Quick start (backend)

```bash
npm install
npm run seed
npm start
# Server at http://localhost:3000
```

### Backend structure

- **server.js** — Express API
- **db/** — SQLite (better-sqlite3), schema, seed
- **public/** — Static assets

See API endpoints and schema in the sections below if you need to connect the frontend to this backend.

---

## API Endpoints (backend)

### Courts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courts` | List all courts (with filters) |
| GET | `/api/courts/:id` | Get single court |
| GET | `/api/courts/:id/availability?date=YYYY-MM-DD` | Get availability grid |

**Filter params for `/api/courts`:** `q`, `surface`, `lights`, `parking`, `min_courts`, `suburb`

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings?email=xxx` | Get bookings by email |
| DELETE | `/api/bookings/:id` | Cancel a booking |

### Weather

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather/:courtId?date=YYYY-MM-DD` | Weather for one court |
| GET | `/api/weather/bulk?date=YYYY-MM-DD` | Weather for all courts |

**Weather API:** Optional OpenWeatherMap key via `OPENWEATHER_API_KEY`. Without it, weather responses show “Weather unavailable”.

---

## UniHack / project vision

- **Vision:** One platform for Sydney tennis — venues, coaches, booking, opening hours, weather-aware flows.
- **Roadmap:** See project docs in `docs/` and the original vision in the repo history.
