# Days Out in Summer

Family activity planning app for West/North Yorkshire. Self-hosted on Proxmox.

## Quick Navigation

| What you need | Where to look |
|---------------|---------------|
| Requirements, PRD, initiatives | `business/` |
| Master project plan + design decisions | `business/project-plan.md` |
| Architecture Decision Records | `business/architecture/adrs/` |
| Architecture overview (C4 diagrams) | `business/architecture/solution-summary.md` |
| Design system, colour tokens | `design/design-system.md` |
| Approved theme mockup (Sky Blue) | `design/mockups/theme-1-sky-blue.html` |
| All application code | `days-out-code/` |
| Database schema | `days-out-code/db/schema.ts` |
| Seed data (70+ activities) | `days-out-code/db/seed.ts` |
| Validated seed data (pre-build reference) | `business/seed-data.md` |
| API documentation | `days-out-code/docs/openapi.json` |

## Key Infrastructure

| Item | Value |
|------|-------|
| Proxmox host | 192.168.1.171:8006 |
| App container | 192.168.1.25 (VMID 111) |
| App URL (local) | http://192.168.1.25:3000 |
| Database | PostgreSQL in Docker Compose |
| Deploy command | `ssh root@192.168.1.25 "cd /opt/days-out && ./deploy.sh"` |

## Initiatives

1. **Initiative 1 — MVP** (current): Browse, PIN auth, Adventure Passport, Family Vote, Add to Calendar, Wishlist
2. **Initiative 2 — Admin Panel**: Activity CRUD, Membership management, This Week's Plan
3. **Initiative 3 — Groq AI**: URL import with AI extraction, potential other Groq uses
4. **Initiative 4 — Offline & PWA**: Service worker, near-me GPS mode

## Architecture Principles

- AUTH-01 exception documented in `business/architecture/adrs/ADR-001-auth-exception.md`
- All ADRs require 5-agent approval board before acceptance
- Seed data validated by multi-agent categorisation process
- £0/month hosting (self-hosted Proxmox, OSS only)
- Design system: Fredoka + Nunito fonts, Lucide SVG icons, Soft UI Evolution style

## Git Workflow

Direct push to `main` is fine (no CI/CD required for home project).
Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
