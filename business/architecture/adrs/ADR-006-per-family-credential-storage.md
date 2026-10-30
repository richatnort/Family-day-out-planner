# ADR-006: Per-Family Credential Storage and JWT Session Extension

**Status:** Accepted
**Date:** 2026-05-09
**Approved by:** ADR Board — Product Manager, Principal Solution Architect, Principal Engineer, Business Analyst (all approved)
**Initiative:** Initiative 5 — Multi-Family Scalability
**Extends:** ADR-001 (Custom PIN Auth — next-auth v5 Credentials Provider exception)

---

## Context

The existing authentication system (ADR-001) stores credentials in `.env`: `FAMILY_PIN_HASH` and `ADMIN_PASSWORD_HASH`. This works for one family. With multiple families, there is no viable way to store N families' credentials in environment variables — it would require `FAMILY_2_PIN_HASH`, `FAMILY_3_PIN_HASH`, etc., and a container restart every time a family is added. Self-service onboarding (a parent completing setup without operator intervention) is impossible under that model.

The existing JWT session carries only `{ role: "pin" | "admin" }`. With multiple families sharing the same infrastructure, every downstream query must know which family the session belongs to — so the JWT must also carry `familyId`.

This ADR documents the migration of credentials from environment variables to a database table, and the extension of the JWT payload. The underlying auth mechanism (next-auth v5 Credentials provider) is unchanged from ADR-001.

**Admin model:** Each family has their own admin password, set by the parent during onboarding. The operator (Richard) does not hold a shared admin credential — each family head manages their own family's admin password. The operator resets admin passwords via CLI for locked-out families.

---

## Options Considered

### Option A: Keep credentials in .env with per-family env vars (rejected)

- Add `FAMILY_1_PIN_HASH`, `FAMILY_2_PIN_HASH`, etc.
- Adding a new family requires editing `.env`, rebuilding and restarting the Docker container
- Self-service parent onboarding is impossible under this model — the operator must restart the container after every family creation
- Fragile at 3 families; completely unmanageable at any larger scale
- Rejected

### Option B: Per-family credentials in a `family_settings` database table (chosen)

- Credentials stored as bcrypt hashes in `family_settings (family_id PK, family_pin_hash, admin_password_hash, pin_session_version, updated_at)`
- next-auth v5 Credentials `authorize()` resolves the family from the URL slug in a single joined DB query, then runs `bcrypt.compare`
- No container restart required to add a family
- JWT session extended to `{ role: "pin" | "admin", familyId: number, pinSessionVersion?: number }`
- PIN reset: increment `pin_session_version` in DB; `jwt` callback validates version on every token refresh
- bcrypt ≥12 rounds maintained (consistent with ADR-001)
- Per-family rate limiting: `pin:{familyId}:{ip}` and `admin:{familyId}:{ip}` — independent counters per family

### Option C: External secrets manager (Vault, Infisical) (rejected)

- Dedicated secrets management platform with proper access control
- Adds an external service dependency — violates the self-hosted principle
- Free tiers exist but introduce reliability coupling to a third-party service
- Massive over-engineering for 3 families where the operator knows everyone personally
- Rejected

---

## Decision

Store all per-family credentials in a **`family_settings` database table** keyed by `family_id`, and extend the JWT session to carry `familyId` and `pinSessionVersion` alongside `role`. This is the only approach compatible with self-service family onboarding and the zero-cost self-hosted constraint.

---

## Implementation Requirements

1. **`family_settings` table** (see ADR-005 for the full `CREATE TABLE` statement). The `pin_session_version` column is central to session invalidation on PIN reset:

   ```sql
   CREATE TABLE family_settings (
     family_id            INTEGER PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
     family_pin_hash      TEXT NOT NULL,
     admin_password_hash  TEXT NOT NULL,
     pin_session_version  INTEGER NOT NULL DEFAULT 1,
     updated_at           TIMESTAMP NOT NULL DEFAULT now()
   );
   ```

2. **Credential lookup is a single joined query — no two-step resolution.** Resolving slug → family_id and then making a second query for `family_settings` creates a TOCTOU window. Use one joined query in `authorize()`:

   ```ts
   const result = await db
     .select({
       familyId:           families.id,
       pinHash:            familySettings.familyPinHash,
       adminHash:          familySettings.adminPasswordHash,
       pinSessionVersion:  familySettings.pinSessionVersion,
     })
     .from(families)
     .innerJoin(familySettings, eq(families.id, familySettings.familyId))
     .where(and(eq(families.slug, credentials.familySlug), eq(families.isActive, true)))
     .limit(1);

   if (!result[0]) return null;  // unknown or inactive family — no rate limit charge
   ```

3. **`familySlug` must be a credential field, not derived from middleware.** The next-auth v5 Credentials `authorize()` function does not automatically receive URL segments. The login form must include `familySlug` as a hidden field, populated client-side from `window.location.pathname.split('/')[1]`. The credentials schema:

   ```ts
   credentials: {
     familySlug: { type: 'text' },
     pin:        { type: 'text' },      // PIN screen
     // or:
     password:   { type: 'password' },  // admin login screen
   }
   ```

4. **Rate limit key construction must follow family resolution.** An invalid slug must be rejected before any rate limit counter is incremented (otherwise a bad slug could exhaust the counter under a valid family's key via a key collision). The ordering in `authorize()`:

   ```
   1. Run the joined slug + credentials query
   2. If no row found → return null (401, no rate limit charge for invalid slug)
   3. Construct rate limit key: `pin:{familyId}:{ip}` or `admin:{familyId}:{ip}`
   4. Check rate limit → return 429 if exceeded
   5. bcrypt.compare(submitted_credential, stored_hash)
   6. Match → return token; no match → increment counter, return null
   ```

   This replaces the existing `pin:{ip}` and `admin:{ip}` key format. Update `lib/auth.ts` accordingly. Family A's lockout counter is structurally independent of Family B's (US-I5-AUTH-6).

5. **TypeScript session augmentation — update `types/next-auth.d.ts`:**

   ```ts
   declare module 'next-auth' {
     interface Session {
       user: {
         role:               'pin' | 'admin';
         familyId:           number;
         pinSessionVersion?: number;  // present only for role: "pin" tokens
       }
     }
     interface JWT {
       role:               'pin' | 'admin';
       familyId:           number;
       pinSessionVersion?: number;
     }
   }
   ```

   Narrow `role` from `string` to `'pin' | 'admin'`. Add `familyId: number`. The `jwt` callback must copy both fields from the `user` object into the token at sign-in, and from the token into the session on every request.

6. **PIN session invalidation via `pin_session_version` counter.** When the parent resets the child PIN:

   - Update `family_settings.family_pin_hash` with the new bcrypt hash
   - Increment `family_settings.pin_session_version` by 1
   - In the `jwt` callback, for all `role: "pin"` tokens, re-fetch `pin_session_version` from `family_settings` on every token refresh and compare:

   ```ts
   if (token.role === 'pin') {
     const current = await db.select({ v: familySettings.pinSessionVersion })
       .from(familySettings)
       .where(eq(familySettings.familyId, token.familyId))
       .limit(1);
     if (!current[0] || current[0].v > (token.pinSessionVersion ?? 0)) {
       return null;  // force re-authentication
     }
   }
   ```

   Admin-role sessions are not invalidated by PIN resets — only `role: "pin"` tokens are checked. The DB read per PIN-role JWT refresh is the cost of stateless session invalidation at this scale.

7. **Migration path for the existing Family 1 credentials.** After ADR-005's migration creates `family_settings` and inserts the `families` row for `id=1`, the existing hashes must be inserted into `family_settings`. Do not embed real hash values in a committed SQL migration file — use a one-time CLI migration script:

   ```ts
   // scripts/migrate-family1-credentials.ts
   await db.insert(familySettings).values({
     familyId:          1,
     familyPinHash:     process.env.FAMILY_PIN_HASH!,
     adminPasswordHash: process.env.ADMIN_PASSWORD_HASH!,
     pinSessionVersion: 1,
   });
   ```

   Run this script once after the Phase 2 migration step. After confirming auth works for Family 1, the `FAMILY_PIN_HASH` and `ADMIN_PASSWORD_HASH` env vars may be removed from `.env`.

8. **`/{slug}/privacy` route does not require authentication.** This static page is exempt from session checks. The middleware (ADR-007) applies slug validation but must not redirect to `/pin` or `/login` for this path. No `familyId` session check is required in the page component.

---

## Caveats

- **`pinSessionVersion` DB read on every PIN-role JWT refresh adds a round-trip.** For PIN-role tokens only. At 3 families with light concurrent usage this is immaterial. If it becomes a bottleneck, add a short in-memory TTL cache (30 seconds) keyed by `familyId` — slugs and session versions are the only values that need caching.
- **Admin sessions are not version-tracked.** Only PIN-role sessions are invalidated on PIN reset. Admin sessions run to their natural `maxAge`. This is acceptable: resetting the PIN does not affect the admin password.
- **Old PIN sessions catch the version mismatch on their next request**, not immediately. The window is one request cycle (~milliseconds), not the full `maxAge`.
- **bcrypt hashes move from `.env` to PostgreSQL.** The `$` escaping hazard documented in CLAUDE.md lesson 4 no longer applies to credential hashes. It still applies to any other `.env` value containing `$` (e.g. `JWT_SECRET`).

---

## Revisit If

- The `pinSessionVersion` DB read becomes a measurable latency concern → add a per-family in-process cache
- A family needs multiple admin users (e.g. two parents) → extend with a separate per-user credentials table
- The app moves to a public internet-facing deployment with unknown users → re-evaluate ADR-001 for full OAuth (per ADR-001's Revisit If clause)
