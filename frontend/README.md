# Frontend — your·rock·is·coming

React SPA for discovering and booking Sydney tennis courts. This is the main app UI.

## Run

```bash
npm install
npm run dev
```

Open **http://localhost:3000** (see `vite.config.ts`: dev server port 3000, `/api` proxied to backend on 3001).

**Without backend:** The app uses mock venues and `localStorage` for bookings; no server required.

## Build

```bash
npm run build
```

Output in `dist/`. The root backend serves this via `express.static('frontend/dist')`.

## Stack

- React 18, TypeScript, Vite 8
- Tailwind CSS, Leaflet / react-leaflet, react-router-dom
- Open-Meteo (weather), react-hot-toast, date-fns, lucide-react

See repo root **README.md** for full feature list, API, and project structure.
