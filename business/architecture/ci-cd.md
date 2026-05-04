# CI/CD Reference — Kay Elizabeth Astro

**Last-verified:** 2026-04-20 — checked against `.github/workflows/ci.yml`

---

## Overview

| Stage | Tool | Trigger |
|-------|------|---------|
| CI | GitHub Actions | Every PR targeting `main` |
| Deployment | Vercel | Auto-deploys on merge to `main` |
| Preview deploys | Vercel | Auto-created for every open PR |

---

## CI Pipeline (`.github/workflows/ci.yml`)

Three checks run in sequence. **All must pass before a PR can merge.**

### Step 1 — Format check
```bash
npm run format:check
```
Runs Prettier in check mode. Fails if any file would be reformatted.

**Known issue — always double-pass before committing:**
```bash
npx prettier --write "src/**/*.{ts,astro}" "public/assets/js/**/*.js"
npx prettier --write "src/**/*.{ts,astro}" "public/assets/js/**/*.js"
npm run format:check
```
`prettier-plugin-astro` has an idempotency bug where a single `--write` leaves some `.astro` files in an unstable state. Skipping the double-pass is the most common cause of CI failures.

### Step 2 — Type check
```bash
npm run typecheck   # runs: astro check
```
TypeScript + Astro type checking. Uses `tsconfig.json` (must exist). Runs with empty env var stubs.

### Step 3 — Build
```bash
npm run build
```
Full Astro production build. Runs with empty env var stubs. Does not deploy.

---

## Environment Variables in CI

All env vars are stubbed as empty strings in CI:

```yaml
env:
  TURSO_DATABASE_URL: ''
  TURSO_AUTH_TOKEN: ''
  WAITLIST_ENCRYPTION_KEY: ''
  ADMIN_PASSWORD_HASH: ''
  ADMIN_COOKIE_SECRET: ''
  EA_API_URL: ''
  EA_API_USER: ''
  EA_API_PASS: ''
  KE_SMTP_USER: ''
  KE_SMTP_PASS: ''
  KE_CONTACT_EMAIL: ''
  KE_GOOGLE_REFRESH_TOKEN: ''
  KE_GOOGLE_CLIENT_SECRET: '{"installed":{}}'
  PUBLIC_TURNSTILE_SITE_KEY: ''
  TURNSTILE_SECRET_KEY: ''
```

**Critical:** `KE_GOOGLE_CLIENT_SECRET` must be stubbed as valid JSON (`{"installed":{}}`) — an empty string breaks JSON.parse at build time.

**When you add a new env var:** Add it to both `typecheck` and `build` steps in `ci.yml` as `VAR_NAME: ''`. If not added, `astro build` or `astro check` will fail with an unrelated-looking error.

---

## Vercel Deployment

### Auto-deploy on merge to main
Merging a PR to `main` triggers an automatic Vercel production deploy. No manual action required.

### Preview deployments
Every open PR gets a Vercel preview URL. Use it to test the feature before merging.

### After changing env vars in Vercel dashboard
Changes to env vars in the Vercel dashboard do **not** take effect until a redeploy. Either:
- Merge a code change to trigger a new deploy, or
- Trigger a manual redeploy from the Vercel dashboard

### Environment variable scopes
| Variable type | Where to set |
|--------------|-------------|
| Runtime secrets | Vercel dashboard → Settings → Environment Variables → Production |
| Local dev | `.env` file (never commit) |
| CI stubs | `.github/workflows/ci.yml` env blocks |

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — auto-deploys to Vercel |
| `feat/<description>` | New features |
| `fix/<description>` | Bug fixes |

Direct pushes to `main` should be blocked in GitHub Settings → Branches.

### PR naming
- Features: `feat: short description` (max 70 chars)
- Bug fixes: `fix: short description`
- Docs: `docs: short description`
- Chore (deps, CI): `chore: short description`

---

## Diagnosing a Failed CI Run

### Format check fails
```bash
# Fix locally:
npx prettier --write "src/**/*.{ts,astro}" "public/assets/js/**/*.js"
npx prettier --write "src/**/*.{ts,astro}" "public/assets/js/**/*.js"
npm run format:check
```
If `format:check` still fails after double-pass, check for a `.prettierignore` conflict.

### Type check fails
1. Run `npm run typecheck` locally to see the full error
2. Common causes:
   - New env var not declared in `ci.yml`
   - `tsconfig.json` missing
   - Type error in a `.ts` or `.astro` file
   - Wrong Turso import (`@libsql/client` instead of `@libsql/client/web`)

### Build fails
1. Run `npm run build` locally with env vars stubbed
2. Common causes:
   - New env var used in code but not in `ci.yml`
   - Import error
   - Astro config syntax error

---

## Emergency Rollback

To roll back a bad production deployment:

1. Find the last good commit: `git log --oneline main`
2. Create a revert commit:
   ```bash
   git revert <bad-commit-sha>
   git push origin main
   ```
   Vercel will auto-deploy the revert.

**Alternatively** from Vercel dashboard:
Dashboard → Deployments → find the last good deployment → "..." menu → "Promote to Production"

Do not use `git push --force` on `main` unless absolutely necessary — it can break other developers' branches and Vercel's deployment history.

---

## Local Development

```bash
npm run dev           # dev server at localhost:4321
npm run format:check  # check formatting
npm run typecheck     # astro check
npm run build         # production build (requires .env with real values)
npm run preview       # preview production build locally
```
