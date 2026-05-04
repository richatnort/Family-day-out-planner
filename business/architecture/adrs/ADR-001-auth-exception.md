# ADR-001: Custom PIN Auth (AUTH-01 Exception)

**Status:** Accepted
**Date:** 2026-05-03
**Approved by:** ADR Board — Business Analyst, Head of Engineering, UI Engineer, Solution Architect, Product Owner (all approved)

---

## Context

The global development guidelines (P01) require OAuth 2.0/OIDC for all authentication. However, this application has characteristics that make OAuth unsuitable:

- Single-family use, self-hosted on a private LAN (192.168.1.x), not publicly accessible at launch
- Children aged 4+ must be able to log in without personal accounts — a shared family PIN is the user-specified requirement
- No sensitive PII stored: the app holds activity metadata and vote counts, nothing health-adjacent or financial
- OAuth requires an external Identity Provider (Google, Auth0) — this violates INFRA-01 (self-hosted only) and OSS-01 (no paid SaaS). Offline OAuth is impractical.

---

## Options Considered

### Option A: OAuth 2.0 with Google (rejected)
- Requires Google accounts — inappropriate for children aged 4+
- Requires internet access to Google's IdP — breaks offline/LAN use
- Violates INFRA-01 and OSS-01

### Option B: next-auth v5 Credentials Provider (chosen)
- Proven library — not roll-your-own auth
- Supports bcrypt PIN/password hashing
- Issues signed HttpOnly SameSite=Strict JWT cookies via next-auth
- No external IdP required
- Well-documented AUTH-01 exception

### Option C: Custom session management (rejected)
- Roll-your-own auth — higher risk of implementation bugs
- Violates P02 (security by design)

---

## Decision

Use **next-auth v5 Credentials provider** with the following mitigations. This is a documented exception to AUTH-01.

**Two authentication tiers:**
- Children: shared family PIN (numeric), bcrypt ≥12 rounds
- Parent admin: password, bcrypt ≥12 rounds

**Security controls:**
- bcrypt ≥12 rounds exceeds NIST SP 800-63B guidance for memorised secrets
- HttpOnly SameSite=Strict JWT cookies (next-auth managed — no custom token code)
- Rate limiting: 5 attempts/min/IP (in-memory — see caveats below)

---

## Implementation Requirements

1. **PIN entry screen** (`/pin`) must use a large numpad layout with ≥56px buttons per the children's interface spec. A native `<input type="password">` is not acceptable — children aged 4+ cannot use a standard text field reliably on touch devices.

2. **Error messaging** must be child-friendly. On rate-limit lockout, show "Take a break and try again soon" — not technical error language.

3. **Session expiry** on the children's interface must show a clear re-entry prompt (return to `/pin`), not a silent redirect or blank screen.

4. **Re-authentication flow** should be seamless — if the session expires mid-use, the child lands back at `/pin` with a friendly message.

---

## Caveats

- **Per-IP rate limiting on a home LAN:** All family members share one public IP. If one child triggers the rate limit, all devices on the LAN are locked out until the window resets. This is acceptable for a family app; document this behaviour in `lib/rate-limit.ts` with a comment so it is not silently "fixed" by adding Redis (which would violate COST-01).

- **In-memory rate limiter resets on container restart.** This is acceptable. Do not introduce a persistent store (Redis etc.) to work around this — that would add a dependency and violate COST-01.

---

## Revisit If

- The app becomes publicly accessible (internet-facing)
- The app stores health, financial, or other sensitive PII
- Initiative 3 introduces shareable public links — if those links enable authenticated actions, AUTH-01 must be re-evaluated for that endpoint
