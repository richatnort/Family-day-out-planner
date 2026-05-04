# Architecture Best Practices — Days Out in Summer

**Last-verified:** 2026-05-03

---

## Mobile First

Children and parents access from phones and tablets. Design at 320px first, scale up.

- Layout fully functional at 320px+
- Touch targets ≥44px everywhere; ≥56px on children's interface (PIN numpad, vote buttons)
- No hover-only interactions — any hover state needs a tap equivalent
- Test portrait and landscape on a real phone before marking a story done

---

## TypeScript

- `tsconfig.json` must have `"strict": true`
- `next build` runs type checking — zero type errors required before deploy
- Never use `any` without a comment explaining why it's unavoidable

---

## Drizzle ORM — NEVER use `drizzle-kit push`

`drizzle-kit push` opens interactive prompts and **hangs unattended** in `deploy.sh` or CI.

**The correct workflow:**
```bash
# Locally, after changing db/schema.ts:
npx drizzle-kit generate   # produces SQL files in db/migrations/
git add db/migrations/
git commit -m "chore: add migration for <change>"

# deploy.sh runs non-interactively:
npm run db:migrate          # drizzle-kit migrate -- reads committed files
```

Commit migration files. Never generate them on the server.

---

## No PII in Logs

```ts
import pino from 'pino';

export const logger = pino({
  redact: ['pin', 'password', 'hash', 'token', 'notes', 'voter_name'],
});
```

Voter names, passport notes, and family names are not logged in production. No sensitive data in URL parameters or error messages.

---

## Design Tokens — No Raw Hex in Components

All colours via Tailwind config mapped to CSS variables. Never hardcode `#2563EB` in a component.

```tsx
// Wrong:
<span className="bg-[#2563EB]">…</span>

// Correct:
<span className="bg-primary">…</span>
```

The canonical token map is in `design/design-system.md`.

---

## Public Repo — Secrets Discipline

The GitHub repo (`richatnort/Family-day-out-planner`) is **public**. Before every commit:

1. Check: no `.env` file staged
2. Check: no `192.168.` LAN IPs in app source files (allowed only in CLAUDE.md)
3. Check: no API keys, bcrypt hashes, or passwords

`docker-compose.yml` uses `env_file: .env` — never inline secret values.
Only `.env.example` (placeholder values) is committed.

---

## Rate Limiting is Per-Process

In-memory rate limiting (in `lib/rate-limit.ts`) resets on container restart. Acceptable for a single-family LAN app. Do not introduce Redis or a persistent store to "fix" this — it would add a dependency and violate COST-01.

The caveat is documented in ADR-001: all family members share one public IP. If one child triggers the limit, all devices are locked out until the window resets. This is intentional and documented.

---

## `"use client"` Boundary Discipline

Server Components handle all data fetching. `"use client"` goes only on leaf components that genuinely need browser APIs or interactivity (PIN pad, vote buttons, heart toggle, calendar sheet, map).

Do not hoist `"use client"` to a layout or page component to avoid a prop-drilling problem — fix the architecture instead.

---

## Leaflet in Next.js App Router

Leaflet accesses `window` and `document` directly. It will cause a server-side render error if not wrapped.

```tsx
// In the activity detail page:
const ActivityMap = dynamic(() => import('@/components/activity-map'), { ssr: false });
```

The `dynamic()` wrap must be **on the entire component**, not just the Leaflet import. The loading fallback must be a fixed-height placeholder to prevent layout shift.

---

## OG Image Fetching

`open-graph-scraper` is called server-side (in a Route Handler or Server Component). It must never be called from a client component — it would expose the server's network to the client and would fail in the browser.

Cache fetched OG images by storing `image_url` in the database on activity creation.

---

## SSRF Protection on URL Import (Initiative 3)

When fetching a URL supplied by the admin (venue website), always run it through `lib/ssrf-guard.ts` before fetching. Block:
- Private IP ranges: 10.x, 172.16–31.x, 192.168.x
- Loopback: 127.x, ::1
- Metadata endpoints: 169.254.x (AWS/GCP metadata)
- Non-HTTP/HTTPS schemes

This is the same pattern used in the shopping-list project (`urlValidation.ts`).

---

## Calendar Links — Client-Side Only

The "Add to Calendar" feature generates Google Calendar and Outlook links in the browser (no server round-trip) and downloads `.ics` files via `GET /api/activities/:id/calendar.ics`. No server-side calendar storage. No OAuth. This keeps the feature simple and avoids any external calendar API dependency.

---

## Simplicity Over Cleverness

Single-maintainer project. No abstractions for hypothetical future needs.

- Three similar lines of code are better than a premature abstraction
- One-shot operations don't need a helper function
- No feature flags, no backwards-compatibility shims — just change the code
- If a library is under consideration: ask whether 20 lines of vanilla code handles it

---

## Component Naming Convention

| Component | Purpose |
|-----------|---------|
| `activity-card.tsx` | Browse grid card (image, badge, heart, tags) |
| `activity-map.tsx` | Leaflet wrapper (dynamic import, no SSR) |
| `add-to-calendar.tsx` | Bottom sheet with date picker + calendar buttons |
| `cost-badge.tsx` | Reusable badge with colour logic |
| `passport-stamp.tsx` | Single stamp card in passport grid |
| `vote-panel.tsx` | Three emoji vote buttons with tallies |

Keep components small. If a component exceeds ~150 lines, it has too many responsibilities.

---

## Gotchas

### 1. Leaflet CSS must be imported
`leaflet/dist/leaflet.css` must be imported in the map component (or globally). Without it, tiles render but controls are broken and the map appearance is wrong.

### 2. react-leaflet requires the component to be fully unmounted on SSR
Even with `ssr: false` on the dynamic import, ensure no Leaflet-specific code runs outside the component (e.g. no `import L from 'leaflet'` at module scope in a Server Component file).

### 3. next-auth v5 session shape
next-auth v5 uses a different session shape from v4. `session.user.id` may not be present by default. Check the session callback in `lib/auth.ts` if you need custom fields.

### 4. Drizzle `db.insert().onConflictDoUpdate()` for upserts
The votes upsert uses `onConflictDoUpdate`. The conflict target must match the unique constraint column names exactly, or Drizzle will throw at runtime.

### 5. Tailwind v4 config differences
Tailwind v4 uses a different config format. Design tokens are defined in CSS variables (not in `tailwind.config.ts`). Check `design/design-system.md` for the correct setup.

### 6. `next/font` requires a CSS variable to be passed to Tailwind
```tsx
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });
// Apply both variable class names to <body>
```
Then in CSS: `font-family: var(--font-fredoka)` etc.

### 7. Docker healthcheck curl
The `Dockerfile` must install `curl` if using a minimal base image. `curl` is not present in `node:alpine` by default. Use `node:lts-alpine` and add `RUN apk add --no-cache curl`.

### 8. PostgreSQL `depends_on` condition
`depends_on: db` (without condition) does NOT wait for PostgreSQL to be ready — only for the container to start. Always use:
```yaml
depends_on:
  db:
    condition: service_healthy
```
