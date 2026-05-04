# Product Requirements Document — Days Out in Summer

**Version:** 1.0  
**Date:** 2026-05-03  
**Status:** Approved  
**Owner:** Richard Atha

---

## Problem Statement

School summer holidays in West/North Yorkshire are six weeks long. Our family has 70+ activities we could do, but we have no easy way to:
- Remember what's available and what we've already done
- Involve the children in choosing (they're 4+ and can't browse a spreadsheet)
- Track which memberships we're actually using

The result: we default to the same three places, forget about venues we paid to join, and waste time discussing "where should we go?" every week.

---

## Product Vision

A family web app that makes school holiday planning fun for children and frictionless for parents. Children browse and vote on adventures. Parents see what the family wants and knows what memberships cover it.

---

## Target Users

| Persona | Age | Tech Level | Primary Goal |
|---------|-----|------------|--------------|
| Child user | 4–12 | Tablet/phone, limited reading | Explore activities, vote, collect stamps |
| Parent | 35–45 | Confident smartphone user | Plan the week, manage memberships, add venues |

**Single-family product.** This is not a multi-tenant SaaS. One family. One instance. Forever free to run.

---

## Success Metrics (Initiative 1)

| Metric | Target |
|--------|--------|
| Children can authenticate unaided | 4-year-old can enter PIN on first attempt |
| All 70+ activities browsable | Seed data loads on first deploy |
| Filter works correctly | Rainy filter returns only rainy/both activities |
| Map loads on activity detail | No Leaflet SSR errors |
| Calendar export works | .ics file opens in iOS Calendar |
| Stamp added end-to-end | Passport stamp appears after visiting |

---

## Constraints

| Constraint | Detail |
|------------|--------|
| COST-01 | £0/month. Existing Proxmox hardware. All OSS. |
| INFRA-01 | Self-hosted on private LAN. No external SaaS. |
| OSS-01 | All tools open-source or free tier. |
| AUTH-01 | OAuth not suitable (children, offline). next-auth v5 Credentials exception documented (ADR-001). |
| SEC-01 | All secrets via Docker Compose `env_file`. Public GitHub repo — zero secrets committed. |
| DEPLOY-01 | `deploy.sh` on server: pull → build → migrate → start. |
| OBSERVE-01 | `/api/health`, pino structured logs, Docker healthchecks. |

---

## Tech Stack

| Layer | Choice | Decision |
|-------|--------|----------|
| Framework | Next.js 15 App Router, TypeScript | ADR-002 |
| Styling | Tailwind CSS v4 + shadcn/ui | ADR-002 |
| Database | PostgreSQL (Docker Compose) | ADR-003 |
| ORM | Drizzle ORM | ADR-003 |
| Auth | next-auth v5 Credentials provider | ADR-001 |
| Maps | Leaflet.js + OpenStreetMap | ADR-004 |
| OG Images | open-graph-scraper | — |
| AI extraction | Groq llama-3.3-70b-versatile | Initiative 3 only |
| Logging | pino | — |
| Validation | Zod + zod-to-openapi | — |

---

## Initiative Summary

### Initiative 1 — MVP (current)
Everything a child can do: browse, filter, vote, passport, calendar, wishlist. 70+ seeded activities. No admin UI — data managed directly in DB until Initiative 2.

**Gate:** Deployed to 192.168.1.25. `/api/health` returns `ok`. All verification checks pass (see `business/initiatives/initiative-1-mvp.md`).

### Initiative 2 — Admin Panel
Parent login, activity CRUD, membership management with expiry alerts, "This Week's Plan" flagging. Requires Initiative 1 live.

### Initiative 3 — Groq AI
URL import: paste a venue website → Groq extracts activity details → form pre-fills. Graceful fallback if Groq unavailable. SSRF protection. Requires Initiative 2 admin panel.

### Initiative 4 — Offline & PWA
Service worker caches activity list and map tiles. GPS "near me" mode using haversine. Requires Initiative 1 stable.

---

## Database Schema

```
activities         id, name, description, category, cost_tier, weather, setting,
                   food, website_url, image_url, lat, lng, location_name,
                   age_min, age_max, prebooking_required, is_active, created_at

memberships        id, name, description, expires_at (nullable)

family_memberships membership_id

activity_memberships activity_id, membership_id

votes              id, activity_id, emoji, voter_name, created_at
                   UNIQUE (activity_id, voter_name)

passport_stamps    id, activity_id, visited_date, notes, photo_url

wishlist_items     activity_id (PK, FK → activities)

settings           key, value  (family_pin_hash, admin_password_hash, family_name)
```

**Removed from early drafts:** `itinerary_items` (replaced by client-side calendar links), `duration_hours` (removed from UX).

---

## Cost Tier Thresholds (hardcoded — not configurable)

| Tier | Per-child entry price |
|------|-----------------------|
| Free | £0 |
| Cheap | £0.01–£7.99 |
| Moderate | £8.00–£14.99 |
| Premium | £15.00+ |

---

## Non-Functional Requirements

| ID | Requirement | Rationale |
|----|-------------|-----------|
| NFR-01 | Touch targets ≥44px everywhere, ≥56px on children's interface | Children 4+ using tablets |
| NFR-02 | Layout functional at 320px+ (mobile-first) | Family phones are primary device |
| NFR-03 | No hover-only interactions | Children use touch, not mouse |
| NFR-04 | `prefers-reduced-motion` respected for all animations | Accessibility |
| NFR-05 | WCAG AA+ contrast (≥4.5:1 for body text) | Readability for young readers |
| NFR-06 | TypeScript strict mode, zero type errors on `next build` | Code quality |
| NFR-07 | Lucide SVG icons throughout — no emoji as structural icons | Accessibility, design consistency |
| NFR-08 | Fonts via `next/font` (not CDN `<link>`) | No external CDN dependency, FOUT prevention |
| NFR-09 | No PII in logs (`pino` redact: pin, password, hash, token) | GDPR |
| NFR-10 | Drizzle migration files committed; never `drizzle-kit push` in deploy | Unattended deploy safety |

---

## Out of Scope (all initiatives)

- Multi-family / multi-tenant use
- Public internet access (LAN only at launch)
- Native mobile app
- Driving directions or routing (map shows pin only)
- Payment processing
- User accounts / personal profiles (shared family PIN only)
