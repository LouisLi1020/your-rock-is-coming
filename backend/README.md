# Backend — your-rock-is-coming

The backend is **planned**, but not required for the earliest MVP demo.

## Planned responsibilities

Aligned with the product roadmap in `../docs/intro.md`:

- **v1.0 / v1.5** (optional backend)
  - Simple API for venues list and filters (if we outgrow static data)
  - Possible integration with council / club endpoints or scraped data
- **v2.0**
  - Booking APIs for time slots (availability, reservation, cancellation)
  - Payment integration layer (Stripe / other)
  - Weather-aware refund / reschedule logic
  - Ratings & reviews storage
- **v3.0+**
  - Coach profiles and matching
  - Social play / events (matchmaking, competition signup)
  - Basic analytics for venues & coaches

## Tech stack (to be decided)

We can keep this flexible until we start backend work. Candidates:

- **Node.js + TypeScript** (Express / Fastify / NestJS)
- Serverless functions (e.g. Cloudflare Workers, Vercel, or AWS Lambda)

When we decide the stack, this README should be updated with:

- How to run the backend locally
- Environment variables and secrets handling (never committed)
- API contract (endpoints, request/response shapes)
