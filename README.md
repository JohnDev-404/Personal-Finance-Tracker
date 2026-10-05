# Personal Finance Tracker

A full-stack web app for tracking income and expenses, with per-user categories, filtering, and a monthly dashboard with charts.

**Live demo:** [personal-finance-tracker-eight-blue.vercel.app](https://personal-finance-tracker-eight-blue.vercel.app)

> The backend is hosted on Render's free tier and spins down after 15 minutes of inactivity. The first request after a cold start can take up to 30 seconds.

![Dashboard screenshot](./docs/screenshot-dashboard.png)
![Transactions screenshot](./docs/screenshot-transactions.png)

---

## Features

- **Auth** — register, login, JWT-protected routes, bcrypt password hashing
- **Categories** — per-user, typed as income or expense, unique per `(user, name, type)`
- **Transactions** — create, edit, delete, filter by type/category, paginated
- **Dashboard** — income/expense/net summary, monthly income-vs-expense bar chart, category breakdown donut, recent transactions
- **Data integrity** — category deletion is blocked while transactions reference it; transaction type is derived from its category, never trusted from the client

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev server, minimal config, huge ecosystem |
| Routing | React Router | Client-side routing with protected-route guards |
| Charts | Recharts | Declarative SVG charts that compose with React |
| Styling | Tailwind CSS v4 | Utility-first; no CSS files to maintain |
| Backend | Node + Express | Minimal, well-understood HTTP layer |
| Database | PostgreSQL (Neon) | Relational integrity, `DECIMAL` for money, real SQL aggregation |
| ORM | Prisma | Typed queries, schema-as-code, first-class migrations |
| Auth | JWT + bcrypt | Stateless auth; passwords never stored in plaintext |
| Validation | Zod | Single schema validates and narrows request input |
| Testing | Jest + Supertest (API), Vitest + React Testing Library (UI) | Integration tests against a real database; component tests against real DOM events |
| Hosting | Render (API), Vercel (SPA), Neon (DB) | Free tier, git-push deploys |

---

## Architecture

```
┌──────────────────┐     HTTPS + JWT      ┌──────────────────┐
│   React (SPA)    │ ───────────────────► │  Express API     │
│  Vercel / CDN    │ ◄─────────────────── │  Render          │
└──────────────────┘      JSON            └────────┬─────────┘
                                                   │ Prisma
                                                   ▼
                                          ┌──────────────────┐
                                          │  PostgreSQL      │
                                          │  Neon            │
                                          └──────────────────┘
```

**Data flow — adding a transaction:**

1. React sends `POST /api/transactions` with `Authorization: Bearer <jwt>`.
2. Express verifies the JWT (`auth.middleware`), validates the body (`validate.middleware` + Zod).
3. The service verifies the category belongs to the requesting user, derives `type` from the category, and inserts.
4. Prisma writes to Postgres. Response returns the created transaction.
5. The client refetches the list and re-renders.

---

## Design decisions

**`Decimal(12, 2)` for money, never `Float`.** Floating-point can't represent `0.1` exactly; summing thousands of transactions drifts. Postgres `NUMERIC` is exact. Prisma serializes it as a string in JSON, so the frontend parses it only at display time.

**CUIDs for IDs, not autoincrement.** Sequential IDs leak row count and are easy to enumerate. CUIDs are collision-resistant, URL-safe, and don't reveal how many users exist.

**Ownership enforced in the `where` clause, not in a pre-check.** Every query uses `where: { id, userId }`. If a row exists but belongs to someone else, the query returns `null` and the endpoint returns 404 — the user can't even learn the ID exists. A pre-check followed by a separate `update` has a time-of-check/time-of-use gap; this doesn't.

**`onDelete: Restrict` on `Transaction → Category`.** Deleting a category with transactions is blocked by the database. Cascading would silently destroy financial records. The API surfaces this as a 409 with an actionable message.

**Transaction `type` is derived, not accepted.** The client never sends `type`. It's read from the category inside the service. Otherwise a user could create an INCOME transaction pointing at an EXPENSE category and break dashboard totals.

**Prisma error mapping is handled centrally.** Services throw; `error.middleware` translates. It handles `P2002` (unique violation → 409), `P2025` (not found → 404), and a raw Postgres `23001` (FK restrict violation) that Prisma 6.7 doesn't map to a `P####` code — checked by code *and* by message fallback.

**Migrations run on deploy, not on a schedule.** `render.yaml` chains `npx prisma migrate deploy && npm start`. On the free tier this is the supported path; `preDeployCommand` requires a paid plan. Migrations are idempotent, so the extra step is a no-op when there's nothing pending.

**Retry middleware for cold starts.** Neon's free tier suspends compute after 5 minutes idle. A `$use` middleware retries `P1001`/`P1002`/`P1017` with backoff instead of failing the first request after a wake-up.

---

## Running locally

**Prerequisites:** Node 20+, a PostgreSQL database (Neon free tier works, or local Docker).

```bash
git clone https://github.com/JohnDev-404/Personal-Finance-Tracker.git
cd Personal-Finance-Tracker
```

### Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
JWT_EXPIRES_IN=7d
```

Then:

```bash
npx prisma migrate dev
npm run dev
```

API runs on `http://localhost:5000`. Health check: `GET /api/health`.

### Frontend

```bash
cd client
npm install
cp .env.example .env
```

Edit `client/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Then:

```bash
npm run dev
```

App runs on `http://localhost:5173`.

---

## Testing

Backend — integration tests against a real Postgres test database:

```bash
cd server
npm test
```

Covers: auth (register, login, `/me`, validation, 401s, duplicate email), categories (CRUD, ownership, unique constraint 409, FK restrict 409), transactions (derived type, ownership, filters, pagination), dashboard (empty state, aggregation math, per-user scoping).

Frontend — component tests:

```bash
cd client
npm test
```

Covers: `FormField` (label, change, error state + `aria-invalid`), `LoginPage` (submit, error banner, session-expired banner).

Tests use a separate database (`NODE_ENV=test` loads `.env.test`). Never run tests against development or production data.

---

## Deployment

| Service | Hosts | Config file |
|---|---|---|
| Neon | PostgreSQL | — |
| Render | Express API | [`render.yaml`](./render.yaml) |
| Vercel | React SPA | [`client/vercel.json`](./client/vercel.json) |

**Migrations** run automatically on Render via `npx prisma migrate deploy && npm start` in the start command.

**Environment variables** in production:

- **Render:** `DATABASE_URL` (prod Neon), `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` (must exactly match the Vercel origin, including scheme, no trailing slash), `NODE_ENV=production`
- **Vercel:** `VITE_API_URL` (Render URL + `/api`) — baked into the bundle at build time

Push to `main` triggers both deploys.

---

## Project structure

```
personal-finance-tracker/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # DB models, relations, indexes
│   │   └── migrations/         # versioned SQL history
│   ├── src/
│   │   ├── config/             # env loading, Prisma singleton
│   │   ├── controllers/        # parse request, call service, send response
│   │   ├── services/           # business logic + DB access
│   │   ├── routes/             # URL → middleware → controller
│   │   ├── middleware/         # auth, validate, error handler
│   │   ├── validators/         # Zod schemas
│   │   ├── utils/              # JWT, password hashing
│   │   ├── app.js              # Express app (no listen — testable)
│   │   └── server.js           # entry point (calls listen)
│   └── tests/                  # Jest + Supertest
├── client/
│   ├── src/
│   │   ├── api/                # axios instance + per-resource wrappers
│   │   ├── components/         # reusable UI
│   │   ├── context/            # AuthContext
│   │   ├── hooks/              # useAuth, useCategories, useTransactions, useDashboard
│   │   ├── layouts/            # AppLayout (nav + outlet)
│   │   ├── pages/              # route-level components
│   │   ├── routes/             # route map + ProtectedRoute
│   │   ├── utils/              # currency/date formatters
│   │   └── test/               # Vitest + RTL
│   └── vercel.json             # SPA rewrite rule
├── render.yaml
└── README.md
```

---

## What I'd add next

- **Refresh token flow** — short-lived access tokens (15m) + rotating refresh tokens in httpOnly cookies. The current setup stores JWTs in `localStorage`, which is vulnerable to XSS; cookies + CSRF tokens are the production-hardened pattern.
- **Recurring transactions** — scheduled inserts via a cron worker.
- **Budget limits per category** — a monthly cap with a progress indicator.
- **CSV import** — parse bank exports, map columns, deduplicate.
- **TypeScript** — end-to-end types from Prisma → Zod (inferred) → Express → React.

---

## License

MIT