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
| App container | CT 111 — **access via `ssh root@192.168.1.171 "pct exec 111 -- <cmd>"`** |
| App URL (local) | http://192.168.1.25:3000 |
| App URL (public) | https://familyday.athafamily.com |
| Database | PostgreSQL in Docker Compose |
| Code on server | `/opt/days-out/days-out-code/` |
| GitHub repo | `richatnort/Family-day-out-planner` |

**CRITICAL: Never push code directly to the server. Always go through GitHub.**
Direct server pushes diverge the server from the repo and mean future `git pull` will fail.

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

**Local `git push` is broken** (Apple Git 2.50.1 on macOS 25.3.0 crashes with SIGBUS / signal 10 in `pack-objects`).
Use `gh api` to push individual files:

```bash
# Read current SHA of the file on GitHub first, then:
/Users/richardatha/bin/gh api --method PUT \
  repos/richatnort/Family-day-out-planner/contents/<path/to/file> \
  --field message="<commit message>" \
  --field content="$(base64 -i <local/path/to/file>)" \
  --field sha="<current_sha_from_GET>"
```

Get a file's current SHA:
```bash
/Users/richardatha/bin/gh api repos/richatnort/Family-day-out-planner/contents/<path> | jq -r .sha
```

## Deploy Workflow

All deployments go through GitHub. Never push files directly to the server.

```bash
# 1. Push changes to GitHub (see gh api method above)

# 2. Pull on server
ssh root@192.168.1.171 "pct exec 111 -- bash -c 'cd /opt/days-out/days-out-code && git pull'"

# 3. Build Docker image (DOCKER_BUILDKIT=0 is mandatory — LXC nesting limitation)
ssh root@192.168.1.171 "pct exec 111 -- bash -c 'cd /opt/days-out/days-out-code && DOCKER_BUILDKIT=0 docker compose build 2>&1 | tail -20'"

# 4. Start/restart
ssh root@192.168.1.171 "pct exec 111 -- bash -c 'cd /opt/days-out/days-out-code && docker compose up -d'"

# 5. Verify
curl https://familyday.athafamily.com/api/health
# Expected: {"status":"ok","db":"ok"}
```

If only env vars changed (no code change), skip build and use `--force-recreate`:
```bash
ssh root@192.168.1.171 "pct exec 111 -- bash -c 'cd /opt/days-out/days-out-code && docker compose up -d --force-recreate app'"
```
`docker compose restart` does NOT re-read `.env` — always use `--force-recreate` for env changes.

## Docker — Lessons Learned (hard-won, do not repeat)

### 1. `DOCKER_BUILDKIT=0` is mandatory on LXC
CT 111 is an LXC container with nested virtualisation. BuildKit fails silently or with cgroup errors.
Always set `DOCKER_BUILDKIT=0` for any `docker compose build` or `docker build` call on this host.

### 2. `drizzle-kit generate` must run inside the Docker builder stage
Drizzle migration SQL files are generated at build time, not committed to git. The `Dockerfile` builder stage runs `npx drizzle-kit generate` before `npm run build`. Do not remove this line. If you remove it, the `COPY --from=builder /app/db/migrations` step will fail because the directory won't exist.

### 3. Seed source files must be in the runner image
`npm run db:seed` runs `db/seed.ts` (TypeScript via tsx) and imports `@/db` (path alias → `db/index.ts`). The runner stage must include the full `db/` source tree and `tsconfig.json` for the path aliases to resolve.
The Dockerfile does this with:
```dockerfile
COPY --from=builder /app/db ./db
COPY --from=builder /app/tsconfig.json ./tsconfig.json
```
If you ever see `Cannot find module '@/db'` when running seed, this COPY is missing.

### 4. bcrypt hashes in `.env` — `$` must be escaped
Docker Compose reads `.env` and performs shell-like variable expansion. Any `$` in a bcrypt hash is treated as a variable sigil and silently stripped.
**Write hashes as:** `FAMILY_PIN_HASH=$2b$12$...` (dollar signs left as-is in the file)
**Never use:** `FAMILY_PIN_HASH='$2b$12$...'` or echo-based writes — both get corrupted.
Generate `.env` locally with a heredoc using single quotes to suppress expansion, then `scp` to server.

### 5. SSH access — CT 111 direct SSH is blocked
`sshd` on CT 111 (192.168.1.25) listens on IPv6, but Docker iptables rules block external IPv4. Direct SSH fails.
**Always use:** `ssh root@192.168.1.171 "pct exec 111 -- bash -c '<cmd>'"`

### 6. Disk space — prune before builds
Each failed Docker build leaves layers behind. Run before any build if disk is tight:
```bash
ssh root@192.168.1.171 "pct exec 111 -- bash -c 'docker system prune -f'"
```
CT 111 has an 8GB disk — 5+ failed builds will fill it.

### 7. Cloudflare tunnel
The tunnel is a systemd service: `cloudflared`. Start it with:
```bash
ssh root@192.168.1.171 "pct exec 111 -- systemctl enable --now cloudflared"
```
Check status: `ssh root@192.168.1.171 "pct exec 111 -- systemctl status cloudflared"`
