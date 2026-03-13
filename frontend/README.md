# Frontend — your-rock-is-coming

## Purpose

This package contains the **web app UI** for our UniHack project:

> A one-stop tennis venue discovery and booking experience for Sydney.

For the hackathon, the frontend focuses on:

- **v1.0 / v1.5** — venue discovery
  - List and card view of courts across Sydney
  - Filters by suburb / surface / basic attributes (later)
  - Clear paths out to official venue sites (transition step before full booking)
- **v2.0** — booking experience
  - Time-slot view, booking & payment flow (in-app)
  - Weather-aware UI and rating surfaces

More product context lives in `../docs/intro.md`.

## Stack

- React 18
- TypeScript
- Vite 8

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Structure

- `index.html` — Vite entry HTML
- `vite.config.ts` — Vite + React config
- `tsconfig.json` — TS settings for React + Vite
- `src/`
  - `main.tsx` — React entry
  - `App.tsx` — shell layout & sections (v1 browsing)
  - `styles.css` — global layout + venue cards
  - `components/VenueList.tsx` — presentational list of venues
  - `data/venues.ts` — seed data for Sydney courts (to be replaced by API later)

## Collaboration notes

- Keep data loading logic simple for v1: static data or a thin fetch wrapper.
- When we add **filters** and **map view**, prefer small, composable components.
- If we add routing (e.g. venue detail pages), we can introduce React Router in a later iteration.
