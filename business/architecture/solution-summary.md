# Solution Summary — Days Out in Summer

**Last-verified:** 2026-05-03

---

## System Overview

A self-hosted family web app running on a single Proxmox LXC container on the home network. No internet exposure at launch. No external SaaS dependencies.

---

## C4 — Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Home Network (192.168.1.0/24)               │
│                                                                 │
│   ┌──────────────┐        ┌──────────────────────────────────┐  │
│   │   Children   │        │                                  │  │
│   │  (tablet /   │───────►│   Days Out in Summer             │  │
│   │   phone)     │        │   http://192.168.1.25:3000       │  │
│   └──────────────┘        │                                  │  │
│                           │   Next.js 15 App Router          │  │
│   ┌──────────────┐        │   + PostgreSQL                   │  │
│   │   Parents    │───────►│   (Docker Compose, VMID 111)     │  │
│   │  (phone /    │        │                                  │  │
│   │   laptop)    │        └──────────────────────────────────┘  │
│   └──────────────┘                      │                       │
│                                         │ Outbound only         │
└─────────────────────────────────────────┼───────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────┐
              │           Internet        │                       │
              │                          ▼                       │
              │  ┌─────────────────────────────────────────────┐  │
              │  │  External services (read-only, on-demand)   │  │
              │  │                                             │  │
              │  │  • tile.openstreetmap.org (map tiles)       │  │
              │  │  • Venue websites (OG image scraping)        │  │
              │  │  • api.groq.com (Initiative 3 only)         │  │
              │  └─────────────────────────────────────────────┘  │
              └─────────────────────────────────────────────────────┘
```

---

## C4 — Container Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│  LXC Container — VMID 111 (192.168.1.25)                          │
│  Docker Engine                                                     │
│                                                                    │
│  ┌─────────────────────────────────────┐                          │
│  │  app (Docker container)             │                          │
│  │                                     │                          │
│  │  Next.js 15 — port 3000             │                          │
│  │                                     │                          │
│  │  ┌──────────────────────────────┐   │                          │
│  │  │  App Router                  │   │                          │
│  │  │  • (children)/ — PIN-gated  │   │                          │
│  │  │  • admin/ — password-gated  │   │                          │
│  │  │  • api/ — Route Handlers    │   │                          │
│  │  │  • pin/ login/ — auth pages │   │                          │
│  │  └──────────────────────────────┘   │                          │
│  │                                     │                          │
│  │  ┌──────────────────────────────┐   │                          │
│  │  │  Server-side libs            │   │                          │
│  │  │  • Drizzle ORM               │   │   ┌──────────────────┐  │
│  │  │  • next-auth v5              │   │   │  db (container)  │  │
│  │  │  • open-graph-scraper        │───┼──►│  PostgreSQL 16   │  │
│  │  │  • pino logger               │   │   │  port 5432       │  │
│  │  │  • Zod validation            │   │   │  vol: pg_data    │  │
│  │  └──────────────────────────────┘   │   └──────────────────┘  │
│  │                                     │                          │
│  └─────────────────────────────────────┘                          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## C4 — Component Diagram (App Router)

```
app/
├── (children)/                 ← Route group, requires PIN session
│   ├── page.tsx                Server Component — fetches activities + wishlist
│   ├── [id]/page.tsx           Server Component — fetches activity + memberships + votes
│   ├── passport/page.tsx       Server Component — fetches stamps
│   └── vote/page.tsx           Server Component — fetches activities + votes
│
├── admin/                      ← Requires admin session (Initiative 2)
│   ├── page.tsx
│   ├── activities/page.tsx
│   └── memberships/page.tsx
│
├── api/                        ← Route Handlers (Zod-validated, openapi.json generated)
│   ├── health/route.ts
│   ├── auth/[...nextauth]/route.ts
│   ├── activities/[id]/calendar.ics/route.ts
│   ├── votes/route.ts
│   ├── passport/route.ts
│   ├── wishlist/route.ts
│   └── memberships/route.ts
│
├── pin/page.tsx                ← Unauthenticated — numpad PIN entry
├── login/page.tsx              ← Unauthenticated — admin password entry (Initiative 2)
└── layout.tsx                  ← Root layout: fonts, global CSS, providers

middleware.ts                   ← next-auth session guard, redirects to /pin or /login
```

---

## Data Flow — Browse Screen

```
Browser                     Server Component              Database
  │                              │                           │
  │ GET /                        │                           │
  │─────────────────────────────►│                           │
  │                              │ SELECT * FROM activities  │
  │                              │ WHERE is_active = true    │
  │                              │ ORDER BY name ASC         │
  │                              │──────────────────────────►│
  │                              │◄──────────────────────────│
  │                              │ GET /api/wishlist         │
  │                              │ (client hydration)        │
  │◄─────────────────────────────│                           │
  │  HTML (SSR) + JS bundle      │                           │
  │                              │                           │
  │ (hydration complete)         │                           │
  │ GET /api/wishlist ───────────┼───────────────────────────►
  │◄──────────────────────────────────────────────────────── │
  │ [activityIds]                │                           │
  │ (heart icons update)         │                           │
```

---

## Data Flow — Vote Cast

```
Browser (client component)     API Route Handler          Database
  │                                  │                       │
  │ POST /api/votes                  │                       │
  │ { activityId, emoji, voterName } │                       │
  │─────────────────────────────────►│                       │
  │                                  │ Zod validate body     │
  │                                  │ INSERT INTO votes     │
  │                                  │ ON CONFLICT           │
  │                                  │ (activity_id,         │
  │                                  │  voter_name)          │
  │                                  │ DO UPDATE SET         │
  │                                  │  emoji = excluded.emoji
  │                                  │──────────────────────►│
  │                                  │◄──────────────────────│
  │◄─────────────────────────────────│                       │
  │ 200 { success: true }            │                       │
  │ (optimistic update already shown)│                       │
```

---

## Infrastructure

| Item | Value |
|------|-------|
| Proxmox host | 192.168.1.171 |
| LXC container | VMID 111, IP 192.168.1.25/24 |
| Gateway | 192.168.1.1 |
| CPU | 2 vCPU |
| RAM | 2 GB |
| Disk | 20 GB |
| OS | Debian 13 |
| Docker | Installed via community-scripts docker.sh |
| App port | 3000 |
| DB port | 5432 (internal only) |

---

## Non-Functional Requirements

| ID | Requirement | Met by |
|----|-------------|--------|
| NFR-01 | Touch targets ≥44px / ≥56px children | Tailwind classes, leaflet-overrides.css |
| NFR-02 | Mobile-first (320px+) | Tailwind responsive classes |
| NFR-03 | No hover-only interactions | Design review at PR time |
| NFR-04 | `prefers-reduced-motion` respected | CSS `@media` + React check |
| NFR-05 | WCAG AA+ contrast | Design tokens validated in design-system.md |
| NFR-06 | TypeScript strict, zero build errors | `tsconfig.json` strict: true |
| NFR-07 | Lucide icons, no emoji as structural icons | Component conventions |
| NFR-08 | Fonts via `next/font` | layout.tsx setup |
| NFR-09 | No PII in logs | pino redact config in lib/logger.ts |
| NFR-10 | Migrations via drizzle-kit generate, never push | deploy.sh + best-practices.md |

---

## Security Controls

| Control | Implementation |
|---------|---------------|
| Auth tokens | HttpOnly SameSite=Strict JWT (next-auth managed) |
| PIN/password hashing | bcrypt ≥12 rounds |
| Rate limiting | In-memory 5 attempts/60s/IP (`lib/rate-limit.ts`) |
| CSRF | next-auth built-in CSRF protection |
| Input validation | Zod on all API route handlers |
| SQL injection | Drizzle parameterised queries (no raw SQL) |
| SSRF (Initiative 3) | `lib/ssrf-guard.ts` — blocks private IPs and non-HTTP schemes |
| Secrets | Docker `env_file` — never in committed code |
| CSP headers | Next.js `headers()` in `next.config.ts` |
| `rel="noopener noreferrer"` | All `target="_blank"` links |

---

## Deployment

```
deploy.sh (runs on 192.168.1.25):

1. git pull origin main
2. docker compose build app
3. docker compose up -d db          # start DB first
4. docker compose run --rm app \
     npm run db:migrate              # run migrations
5. docker compose up -d app         # start app
6. wait for /api/health → { status: ok, db: ok }
```

Zero-downtime is not required. There is a brief migration window where the old container is stopped and the new one is migrating. Acceptable for a family home app.
