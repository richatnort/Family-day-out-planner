# ADR-003: PostgreSQL over SQLite

**Status:** Accepted
**Date:** 2026-05-03
**Approved by:** ADR Board — all 5 roles approved

---

## Context

Need a relational database for activities, memberships, family_memberships, activity_memberships, votes, passport_stamps, and settings. The data has relational structure (many-to-many between activities and memberships, foreign keys on votes and stamps) that benefits from a proper relational engine.

---

## Options Considered

### Option A: SQLite via Drizzle (rejected)
- Zero-config, embedded, no separate container
- File-based — backup requires volume snapshot or file copy
- Limited concurrent write performance (single writer)
- Cannot be accessed independently of the app container for maintenance/inspection

### Option B: PostgreSQL in Docker Compose (chosen)
- Separate `db` service with its own healthcheck
- Named Docker volume — data survives container recreation
- Consistent with other self-hosted apps in this workspace (shopping list also uses PostgreSQL — same operational skills apply)
- Full SQL support, proper ACID transactions, concurrent access
- Drizzle ORM supports it natively
- 20 GB disk allocation is ample

### Option C: Turso / libSQL cloud (rejected)
- External hosted service — violates INFRA-01 (self-hosted only)
- Free tier limits; cost at scale violates COST-01

---

## Decision

**PostgreSQL as a separate Docker Compose service with a named volume.**

---

## Implementation Requirements

1. **Named volume:** `docker-compose.yml` must declare a named volume for the Postgres data directory (e.g. `pg_data`). Without this, `docker compose down` destroys all data.

2. **Health check and start order:** The app service must use `depends_on: { db: { condition: service_healthy } }` — not just `depends_on: db`. Without the health condition, the app can attempt to connect before Postgres is ready, causing startup failures.

3. **Migrations:** Use `drizzle-kit generate` locally to produce SQL migration files in `db/migrations/`. Commit these files. `deploy.sh` runs `npm run db:migrate` (drizzle-kit migrate, non-interactive). **Never use `drizzle-kit push` in CI or deploy scripts** — it opens interactive prompts and hangs unattended.

4. **Backup:** Add a daily `pg_dump` cron job on the Proxmox host (or within the LXC) that dumps to a host-mounted path outside the container. Even for a family app, data loss from a volume mishap matters. The restore procedure must be documented.

   Suggested cron (on the LXC host):
   ```bash
   0 2 * * * docker exec days-out-db-1 pg_dump -U postgres daysout > /opt/backups/daysout-$(date +%Y%m%d).sql
   ```

5. **Migration outage window:** `deploy.sh` runs migrations before the new container is healthy. There is a brief window where the old container is stopped and the new one is migrating. This is acceptable for a family home app; document it here as a known limitation.

---

## Revisit If

- Storage constraints on the LXC (20 GB allocated — unlikely to be an issue)
- Multiple families use the app (scale consideration for connection pooling)
