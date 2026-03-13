# your-rock-is-coming — UniHack 2026

Inspired by the resilience of a small stone, we believe that with persistence, we can reach the top—and that every participant can be a champion in their own way.

---

## Project Vision

We are building an **integrated platform** that brings together tennis clubs and venues across the **Sydney region** in one place. The platform will be delivered as a **web application** that centralises:

- Tennis venues and clubs  
- Coaches and lessons  
- Booking systems and availability  
- Opening hours and facility information  

Our goal is to make it easier for players to discover, compare, and access tennis facilities in Sydney — turning the whole journey from “I want to play” to “I have a confirmed court” into a simple, reliable flow.

---

## Problem Space

Today, Sydney tennis players face several pain points:

- **Fragmented information**: Courts are spread across local councils, private clubs and schools, each with their own outdated websites or booking tools. Players must jump between many tabs to find a free court.  
- **High decision friction**: There is no unified way to compare price, surface type (grass / hard / clay / synthetic), indoor/outdoor, or whether the venue has night lighting.  
- **Poor refund / reschedule experience**: Sydney’s weather changes quickly; rain often makes outdoor courts unusable, but existing systems rarely support smooth, semi-automated refund or reschedule flows.

---

## Target Users

- **Core users**: Frequent Sydney tennis players and amateur league / social comp participants.  
- **Potential users**: New players who want to try tennis, and parents/students looking for coaching or lessons.

---

## Roadmap

### MVP & v1.x — Find a court

Focus: break the “information silo” problem and make **finding** courts delightful.

| Version | Deliverable |
|--------|-------------|
| **v1.0** | Basic venue browse: list + cards with location, suburb, surface type, opening hours, contact and website links. |
| **v1.5** | Smarter discovery: map / LBS search, multi‑facet filters (surface, indoor/outdoor, lights, price range) and richer venue detail pages (amenities like toilets, water, parking). |

### v2.0 — Book, pay, and handle weather

Focus: close the loop from **“see court” → “book court” → “handle rain”**.

- In‑platform booking with visible **time slots**.  
- Aggregated payments and digital entry pass (QR / booking code).  
- Venue ratings and reviews (maintenance, value, “real” photos).  
- Weather‑aware flows using a weather API: rain probability hints when booking; one‑click rainy‑day refund or reschedule for outdoor courts.

### v3.0+ — Sydney tennis ecosystem

Focus: go beyond a tool into a **tennis ecosystem**.

- Coach profiles and matchmaking (experience, rating, pricing, availability).  
- Social play and events: “find a hitting partner” by skill level, casual hitting sessions, and local amateur competition sign‑ups.  
- Vertical commerce: curated gear and consumables (rackets, balls, strings, ball machines, apparel) targeting a high‑intent tennis audience.

---

## Future / Stretch Ideas

- **Maps integration** — Connect with Google Maps and Apple Maps for directions and “get there” flows.  
- **Live venue status** — Show real-time indicators (e.g. busy level, court availability, weather/temperature).  
- **Route optimisation** — Suggest the best way to get to a chosen venue (time, traffic, transport).

---

## Tech Stack

### What we are using now

- **Frontend**:  
  - React 18 + TypeScript  
  - Vite 8 as the build tool / dev server  
  - Simple CSS for a clean, card-based UI (no heavy UI framework for now)
- **Docs / planning**:  
  - Markdown docs in this repo under `docs/` to track product vision, rules, and checkpoints.

### Planned backend & integrations

- **Backend (planned)**: Node.js + TypeScript or serverless functions, providing:
  - Venue search APIs (replacing static seed data)
  - Booking & payment endpoints (v2.0)
  - Weather-aware refund / reschedule logic
- **Third-party services (roadmap)**:
  - Maps API for LBS search and directions  
  - Weather API to power rain-aware booking flows  
  - Payment provider (e.g. Stripe) for secure, aggregated checkout

---

## UniHack folder structure & rules

> High-level project folder only. No code or design work will be added here until the official UniHack 48-hour build window starts.

This folder will contain the implementation for the **your-rock-is-coming** project during UniHack 2026.

Planned (during competition only):

- `frontend/` — web app for browsing tennis venues & clubs in Sydney
- `backend/` — APIs, data aggregation, booking/payment logic (if implemented)
- `docs/` — technical notes created **during** the hackathon

All actual development and design work will begin **after** UniHack officially starts, in accordance with the rules.
