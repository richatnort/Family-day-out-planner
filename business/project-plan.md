# Days Out in Summer — Project Plan

**Last updated:** 2026-05-03  
**Theme selected:** Sky Blue (Theme 1)  
**Status:** Approved — executing Initiative 1

---

## Context

A family web app to help plan school holiday activities across West/North Yorkshire. Two audiences:
- **Children (4+)**: Fun, gamified browsing — Adventure Passport, Family Vote, Surprise Me
- **Parents**: Manage activities, record memberships (with expiry dates), add new venues via URL auto-import

Self-hosted on Proxmox. Free to use. Single-family instance. Children access via shared family PIN; parent admin has a separate password. Activity images auto-fetched via Open Graph from venue websites.

Seed dataset: 70+ Yorkshire activities with full validated metadata.

---

## Project Folder Structure

```
days-out-summer/
├── business/             ← requirements, initiatives, ADRs (this file)
├── design/mockups/       ← 3 HTML theme mockups (Sky Blue chosen)
├── days-out/             ← Next.js application code
└── CLAUDE.md             ← quick navigation guide
```

---

## Design — Sky Blue Theme

**Typography:** Fredoka (headings) + Nunito (body)  
**Style:** Soft UI Evolution — soft shadows, WCAG AA+, 150–300ms spring animations

| Token | Value |
|-------|-------|
| Primary | `#2563EB` |
| Secondary | `#059669` |
| Accent | `#D97706` |
| Background | `#F8FAFC` |
| Foreground | `#0F172A` |
| Muted | `#F1F5FD` |
| Border | `#E4ECFC` |

**Icons:** Lucide React SVG — NO emojis as structural icons.  
**Touch targets:** ≥44px everywhere; ≥56px children's interface.

---

## Cost Tier Definitions (hardcoded)

| Tier | Per-child entry price |
|------|-----------------------|
| Free | £0 |
| Cheap | £0.01 – £7.99 |
| Moderate | £8.00 – £14.99 |
| Premium | £15.00+ |

These thresholds are written into the Groq extraction prompt and the admin form validation. Not configurable.

---

## Architecture Constraints

### AUTH-01 Exception (documented)
next-auth v5 Credentials provider + bcrypt (≥12 rounds), HttpOnly SameSite=Strict JWT cookies, rate limiting 5/min/IP. Justified: single-family LAN, no sensitive PII, OAuth would require external IdP violating INFRA-01/OSS-01.

### COST-01: £0/month
All self-hosted on existing Proxmox hardware. All tools OSS. Groq free tier: 14,400 requests/day — family use is ~5-10/day.

### Other constraints satisfied
DEPLOY-01 (deploy.sh), OBSERVE-01 (pino + /api/health + Docker healthchecks), SEC-01 (Docker env_file), SEC-02 (CSRF, rate limiting, Zod, CSP), API-01 (zod-to-openapi → openapi.json), OSS-01, INFRA-01.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL (Docker Compose) |
| ORM | Drizzle ORM |
| Auth | next-auth v5 Credentials provider |
| Maps | Leaflet.js + OpenStreetMap |
| OG Images | `open-graph-scraper` |
| AI | Groq `llama-3.3-70b-versatile` (activity URL import) |
| Logging | pino |
| Validation | Zod + zod-to-openapi |

---

## Database Schema

```
activities
  id, name, description, category, cost_tier, weather, setting,
  food, website_url, image_url, lat, lng, location_name,
  age_min, age_max, prebooking_required, is_active, created_at

memberships
  id, name, description, expires_at (nullable date)

family_memberships
  membership_id

activity_memberships
  activity_id, membership_id

votes
  id, activity_id, emoji, voter_name, created_at

passport_stamps
  id, activity_id, visited_date, notes, photo_url

settings
  key, value (family_pin_hash, admin_password_hash, family_name)
```

**Removed from original plan:** `itinerary_items` table (replaced by calendar integration), `duration_hours` (removed from UX).

---

## Feature Spec — Children's View (`/`) — PIN gated

### Browse (Home)
- Card grid (2 columns, mobile-first)
- **Default sort: alphabetical by name**
- Filter bar at top: [☀️ Sunny] [🌧 Rainy] [🏠 Indoor] [🌳 Outdoor] — toggle chips, multi-select
- Each card:
  - OG image (or gradient placeholder)
  - Activity name (Fredoka)
  - Cost badge: green "FREE w/ NT" / blue "Cheap" / amber "Premium" etc.
  - Weather + setting tags (Lucide icons)
  - **Heart wishlist button on the card** (not on detail page)
- Surprise Me! button — prominent, animated, respects active filters

### Activity Detail (`/[id]`)
- OG image hero
- Name + cost badge + membership note
- Tags: weather, indoor/outdoor, food available
- ~~Duration~~ — removed
- Description
- Leaflet map pin
- "Visit Website" link button
- Vote row: 👍 Love it | 😐 Maybe | 😴 Not for me
- **"Add to Calendar" button** — opens calendar sheet (see below)
- ~~Separate Wishlist button~~ — removed (wishlist is on the card only)

### Add to Calendar (on Activity Detail)
Tapping "Add to Calendar" opens a bottom sheet with:
1. Date picker (pick a day)
2. Optional time picker
3. Three calendar buttons:
   - **Google Calendar** — opens `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...`
   - **Apple Calendar** — downloads `.ics` file (works for iCal on iOS/macOS and Outlook on Windows)
   - **Outlook** — opens `https://outlook.live.com/calendar/0/deeplink/compose?...`
4. No server-side calendar storage — purely client-side links/file generation
5. The event includes: activity name, website URL, and map location in the description field

### Adventure Passport (`/passport`)
- Stamp grid showing visited activities
- Progress bar: "X of Y adventures"
- Tap stamp → visit memory (date + optional photo/note)

### Family Vote (`/vote`)
- Activities parent has flagged as "considering this week"
- Emoji vote tally

### This Week's Plan (`/plan`)
- Read-only list of activities flagged as confirmed for the week
- Mystery activities show lock icon
- Each has "Add to Calendar" button

---

## Feature Spec — Parent Admin (`/admin`) — Password gated

### Activity Manager
Full CRUD with all attributes. Activities listed alphabetically.

On add/edit form:
- Manual form (all fields)
- **OR: URL Import tab** — paste a venue URL → Groq extracts details (see below)

### URL Import via Groq
1. Parent pastes a venue website URL
2. Backend fetches page content (with SSRF protection — same allowlist/blocklist pattern as shopping list)
3. Sends to Groq `llama-3.3-70b-versatile` with extraction prompt
4. Groq returns structured JSON:
   ```json
   {
     "name": "Eureka! The National Children's Museum",
     "description": "...",
     "setting": "both",
     "weather": "rainy-friendly",
     "cost_tier": "moderate",
     "food": "on-site",
     "category": "museum",
     "prebooking_required": false,
     "website_url": "https://eureka.org.uk"
   }
   ```
5. Form pre-fills with extracted data — parent reviews and can edit all fields before saving
6. **Groq is not on the critical path** — if extraction fails, parent sees the manual form with a toast: "Auto-fill unavailable — please fill in manually"
7. Cost tier prompt includes the hardcoded thresholds (free/cheap/moderate/premium definitions)

### Membership Manager
- Add/remove family memberships
- Fields: Name, Description, **Expiry Date (optional)**
- When viewing, memberships show:
  - Green dot if active (no expiry or expiry is future)
  - Amber dot if expiring within 30 days
  - Red dot if expired
- Admin dashboard sorts memberships expiring soonest to top
- When planning, activities covered by an expiring-soon membership get a subtle badge: "NT expires Aug 31"

### Admin dashboard
- Activity count by category
- Votes summary (what children want this week)
- Membership expiry alerts

---

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | none | Health check |
| POST | `/api/auth/[...nextauth]` | — | next-auth handlers |
| GET | `/api/activities` | pin | Browse with filters |
| GET | `/api/activities/:id` | pin | Activity detail |
| POST | `/api/activities` | admin | Create activity |
| PUT | `/api/activities/:id` | admin | Update activity |
| DELETE | `/api/activities/:id` | admin | Delete activity |
| POST | `/api/activities/import` | admin | URL → Groq extraction |
| GET | `/api/activities/:id/calendar.ics` | pin | Download iCal file |
| POST | `/api/votes` | pin | Cast a vote |
| GET | `/api/votes` | admin | View all votes |
| POST | `/api/passport` | pin | Mark activity visited |
| GET | `/api/passport` | pin | Get stamp collection |
| GET | `/api/memberships` | pin | Get memberships (for cost display) |
| POST | `/api/memberships` | admin | Add membership |
| PUT | `/api/memberships/:id` | admin | Update membership |
| DELETE | `/api/memberships/:id` | admin | Remove membership |

All API routes have Zod schemas. `zod-to-openapi` generates `docs/openapi.json`.

---

## Code Directory Structure

```
days-out/
├── app/
│   ├── (children)/
│   │   ├── page.tsx              # Browse (alphabetical, filterable)
│   │   ├── [id]/page.tsx         # Activity detail + Add to Calendar
│   │   ├── passport/page.tsx
│   │   ├── vote/page.tsx
│   │   └── plan/page.tsx
│   ├── admin/
│   │   ├── activities/page.tsx   # List + CRUD + URL import
│   │   ├── memberships/page.tsx  # With expiry dates + alerts
│   │   └── page.tsx              # Dashboard
│   ├── api/
│   │   ├── health/route.ts
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── activities/route.ts
│   │   ├── activities/[id]/route.ts
│   │   ├── activities/[id]/calendar.ics/route.ts
│   │   ├── activities/import/route.ts  # Groq extraction
│   │   ├── votes/route.ts
│   │   ├── passport/route.ts
│   │   └── memberships/route.ts
│   ├── pin/page.tsx
│   ├── login/page.tsx
│   └── layout.tsx
├── components/
│   ├── activity-card.tsx         # Card with wishlist heart
│   ├── activity-map.tsx          # Leaflet wrapper
│   ├── add-to-calendar.tsx       # Calendar sheet + links
│   ├── cost-badge.tsx
│   ├── membership-expiry-badge.tsx
│   ├── passport-stamp.tsx
│   └── vote-panel.tsx
├── db/
│   ├── schema.ts
│   ├── migrations/
│   └── seed.ts                   # 70+ activities (validated data)
├── lib/
│   ├── auth.ts
│   ├── groq.ts                   # Groq client + extraction prompt
│   ├── og-fetcher.ts
│   ├── calendar.ts               # iCal generation + calendar URL builders
│   ├── ssrf-guard.ts             # URL allowlist/blocklist (same pattern as shopping list)
│   ├── rate-limit.ts
│   └── logger.ts
├── docs/openapi.json
├── docker-compose.yml
├── Dockerfile
├── deploy.sh
└── .env.example
```

---

## Environment Variables

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
ADMIN_PASSWORD_HASH
FAMILY_PIN_HASH
GROQ_API_KEY
LOG_LEVEL=info
```

---

## Infrastructure

| Parameter | Value |
|-----------|-------|
| Proxmox host | 192.168.1.171 |
| App container | 192.168.1.25 (VMID 111) |
| Script | community-scripts `docker.sh` |
| RAM | 2 GB |
| Disk | 20 GB |

---

## Initiatives

### Initiative 1 — MVP (current)
Everything in this plan. Browsable activity list, Adventure Passport, Family Vote, URL import, Add to Calendar, memberships with expiry.

### Initiative 2 — Smarter Planning
- OpenWeatherMap integration: today's weather → suggests matching activities
- Distance from home: haversine from stored postcode → "~35 min drive" on cards
- Age-range filtering: `age_min`/`age_max` on activities

### Initiative 3 — Memories & Sharing
- Post-visit memories: photo + note per passport stamp
- Shareable read-only link to show another family this week's plan
- Print/export view

### Initiative 4 — Offline & PWA
- Service worker caches activity list + map tiles
- "Near me" mode using GPS

---

## ADR Review Process

All 4 ADRs (auth, Next.js fullstack, PostgreSQL, Leaflet) reviewed by 5-agent board: Business Analyst, Head of Engineering, UI Engineer, Solution Architect, Product Owner. Files written to `business/architecture/adrs/`.

---

## Seed Data Validation

70+ activities validated in 3 parallel batches by 3-agent categorisation + reconciliation agent. Batch 2 (activities 26-55) validated output saved below for reference.

---

## Verification

1. Provision VMID 111 at 192.168.1.25
2. `./deploy.sh` — build, migrate, seed, start
3. `GET /api/health` → `{ "status": "ok" }`
4. Children PIN → browse shows alphabetically sorted activities
5. Filter "rainy day" → only rainy-friendly shown
6. Tap activity → detail with map, cost badge, Add to Calendar button
7. Add to Calendar → pick date → Google Calendar link opens with correct event
8. Heart on card → activity marked as wishlist
9. Admin: paste venue URL → Groq extracts details → form pre-fills
10. Admin: add NT membership with expiry date → activities show "FREE w/ NT" badge → expiry warning shows when <30 days
11. Disconnect internet → Groq fails gracefully → manual form shown
12. 6 rapid PIN attempts → rate limited (429)
