# ADR-002: Next.js 15 Full-Stack (No Separate API Service)

**Status:** Accepted
**Date:** 2026-05-03
**Approved by:** ADR Board — all 5 roles approved

---

## Context

Need a web framework to serve both the children's browsing interface and the parent admin panel, with server-side data access and REST API endpoints.

---

## Options Considered

### Option A: Next.js 15 App Router, full-stack (chosen)
- Single Docker container
- Server Components for data fetching — Drizzle ORM runs server-side, no network hop
- API Route Handlers for REST endpoints (Zod validated, openapi.json generated)
- TypeScript throughout with strict mode
- Tailwind CSS v4 + shadcn/ui
- next-auth v5 middleware handles PIN/admin session routing

### Option B: Next.js frontend + separate Express/Fastify API
- Two containers to orchestrate and deploy
- CORS configuration required
- No benefit for a solo-developer, single-family app
- Doubles operational surface area

### Option C: Remix
- Technically sound SSR framework
- Smaller ecosystem for shadcn/ui and next-auth v5 integration
- Team familiar with Next.js — less friction

---

## Decision

**Next.js 15 App Router, full-stack, single Docker container.**

---

## Implementation Requirements

1. **Dockerfile:** Must set `NODE_ENV=production` and run `next build`. A dev-mode container on a 2 GB LXC will be noticeably sluggish on children's devices.

2. **App directory path:** The application code lives in `days-out-code/`. The `Dockerfile` and `deploy.sh` must reference this path explicitly — a mis-pointed build context is a silent failure.

3. **`"use client"` boundary:** Isolate interactive components (PIN pad, vote buttons, passport stamps, heart toggle) to leaf components. Server Components handle all data fetching. This minimises the client JS bundle shipped to mobile devices.

4. **shadcn/ui design tokens:** shadcn default `--radius`, `--shadow`, and colour tokens must be overridden with Sky Blue design system values in `globals.css` and `tailwind.config.ts` before any shadcn components are added. If not done early, visual inconsistency proliferates and requires a sweep to fix later.

5. **Fonts:** Load Fredoka and Nunito via `next/font` (not a `<link>` tag to Google Fonts CDN). `next/font` provides automatic subsetting, `font-display: swap`, and eliminates FOUT with no CDN dependency.

6. **Docker healthcheck:** The `docker-compose.yml` healthcheck must call `curl -f http://localhost:3000/api/health` inside the container. The health endpoint must be responsive before the container is marked healthy. Without this, `depends_on: { condition: service_healthy }` in any orchestration won't work.

---

## Revisit If

- A public API is needed (mobile app, third-party consumption) — split into API service at that point
