# Initiative 5: Multi-Family Scalability

**Status:** Pending — requires Initiative 2 live (confirmed)  
**Dependencies:** Initiative 2 deployed and verified  
**User story review:** 5-agent review required before build begins (same process as Initiative 1)  
**Reviewed by:** 6-stakeholder discovery session (Research Analyst, Parent+Children Persona, Business Analyst, Product Manager, Developer, UX Engineer)

---

## Goal

Prove that Days Out in Summer can support multiple independent families simultaneously, each with their own URL, PIN, admin password, activities, and memberships, while remaining maintainable by a solo operator. Minimum viable rollout: 3 families.

---

## Scope

### In scope

- `families`, `family_settings`, `setup_tokens`, and `setup_progress` tables (new)
- `family_id` column added to all tenant-scoped tables via Drizzle migration
- JWT session updated to carry `family_id` alongside `role`
- Family-scoped URL routing: `/{slug}/`, `/{slug}/pin`, `/{slug}/login`, `/{slug}/admin`
- Operator CLI commands: create setup link, reset password, delete family data
- One-time setup token (single-use, 48-hour expiry)
- 7-step parent onboarding wizard at `/{slug}/setup`
- Middleware: extract slug → validate family → attach `family_id` to every request context
- All API routes scoped by `family_id` from session (every query includes `WHERE family_id = ?`)
- Bulk-copy of seeded activities into new family's namespace at onboarding
- Self-service PIN reset (parent enters admin password → sets new PIN → invalidates child sessions)
- Per-family rate limiting (`pin:{family_id}:{ip}`, `admin:{family_id}:{ip}`)
- Privacy policy static page at `/{slug}/privacy`
- `business/privacy-policy.md` — 1-page policy document
- `business/consent-template.md` — parental consent email template for operator use

### Out of scope

- Email-based family invitations (operator sends setup link via WhatsApp/SMS manually)
- Self-service admin password reset without operator involvement
- Audit logs per family action
- Per-family data export (CSV / JSON)
- Cross-family activity sharing
- Multi-admin per family (one admin per family for MVP)
- Operator UI for family management (CLI only)
- Connection pooling (PgBouncer) — unnecessary at 3 families
- Offline/PWA mode (Initiative 4)
- Groq AI URL import (Initiative 3) — deferred until multi-tenancy is stable

---

## Decisions Made During Review

### D-I5-01: Per-family copy of seeded activities

**Decision:** At onboarding Step 5, all 70+ seeded activities are bulk-copied to the new family's namespace. The family owns their copy from that point on. Edits, deactivations, and deletions affect only their copy, not other families.

**Rejected:** Global shared pool (requiring `WHERE family_id IS NULL OR family_id = ?` on every query — complex, harder to test for isolation gaps, and creates ambiguity around family customisation).

### D-I5-02: Family identification via URL slug

**Decision:** Each family has a unique, immutable URL slug (e.g., `jones-family`). Their daily-use URL is `/{slug}/` which goes straight to the PIN screen. The slug is set at family creation and never changes.

How a family receives their URL: operator runs the CLI command once, which outputs the full setup link. Operator sends it via WhatsApp/SMS. After setup, family bookmarks `/{slug}/`. Children navigate to the bookmarked URL every time.

Invalid or unknown slugs return 404 — no information disclosed about which families exist.

**Rejected:** Family selector dropdown (exposes other families' names), family code at PIN screen (children must remember two things), subdomains (requires Cloudflare wildcard DNS config on home server).

### D-I5-03: Setup token delivery

**Decision:** Operator sends the setup link out-of-band (WhatsApp, SMS, etc.). No in-app email for MVP. Token is single-use, expires after 48 hours, returns 404 if used or expired.

### D-I5-04: Admin password reset — operator-initiated only

**Decision:** Parents cannot self-reset their admin password (no email = no recovery channel). If locked out, parent contacts operator. Operator resets via CLI, communicates the new password out-of-band.

**Why not self-service:** Requires email collection, which contradicts the PII minimum principle. Acceptable at 3 families where operator knows each family personally.

### D-I5-05: Self-service PIN reset — parent-initiated via admin password

**Decision:** Parent can reset the child PIN themselves. From `/{slug}/pin`, a "Forgot PIN?" link prompts for the admin password. On success, the numpad is shown to set a new PIN. All existing child sessions are invalidated.

### D-I5-06: Per-family rate limiting

**Decision:** `checkRateLimit('pin:{family_id}:{ip}')` and `checkRateLimit('admin:{family_id}:{ip}')`. Each family has independent counters. Family A's failed attempts do not affect Family B's rate limit window.

**Why it matters:** On a shared home server, multiple families may share the same external IP. If rate limiting is IP-only, one family's child mashing buttons locks out all families on that IP.

### D-I5-07: GDPR — data deletion is a legal requirement

**Decision:** Operator must be able to hard-delete all of a family's data on request. Implemented as a CLI script for MVP: `npm run family:delete --slug="xyz"`. Output includes a count of deleted rows per table as confirmation. Parental consent must be obtained before any family's data is processed (see `business/consent-template.md`).

### D-I5-08: PII minimum

**Decision:** No email addresses stored. No child names stored in the database. Voter names remain localStorage only (already the case in Initiative 1). The only PII in the database is the optional `families.name` field (e.g., "Jones Family") which the parent enters themselves during onboarding and can leave blank.

---

## Schema Changes

### New tables

```sql
-- One row per family. Slug is the URL identifier.
CREATE TABLE families (
  id         SERIAL PRIMARY KEY,
  name       TEXT,                              -- optional, e.g. "Jones Family"
  slug       TEXT NOT NULL UNIQUE,              -- URL identifier, e.g. "jones-family"
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Per-family auth credentials (moved out of .env)
CREATE TABLE family_settings (
  family_id          INTEGER PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  family_pin_hash    TEXT NOT NULL,             -- bcrypt ≥12 rounds
  admin_password_hash TEXT NOT NULL,            -- bcrypt ≥12 rounds
  updated_at         TIMESTAMP NOT NULL DEFAULT now()
);

-- One-time setup tokens (single-use, 48h TTL)
CREATE TABLE setup_tokens (
  id         SERIAL PRIMARY KEY,
  family_id  INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,              -- crypto.randomUUID()
  is_used    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  expires_at TIMESTAMP NOT NULL                 -- created_at + 48h
);

-- Tracks how far a family got through onboarding (enables resume)
CREATE TABLE setup_progress (
  family_id           INTEGER PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  pin_set             BOOLEAN NOT NULL DEFAULT false,
  activities_copied   BOOLEAN NOT NULL DEFAULT false,
  memberships_seen    BOOLEAN NOT NULL DEFAULT false,
  completed_at        TIMESTAMP                 -- NULL until setup is fully done
);
```

### Altered tables

All tenant-scoped tables gain a `family_id` column:

```sql
ALTER TABLE activities          ADD COLUMN family_id INTEGER REFERENCES families(id);
ALTER TABLE memberships         ADD COLUMN family_id INTEGER REFERENCES families(id);
ALTER TABLE family_memberships  ADD COLUMN family_id INTEGER REFERENCES families(id);
ALTER TABLE votes               ADD COLUMN family_id INTEGER REFERENCES families(id);
ALTER TABLE passport_stamps     ADD COLUMN family_id INTEGER REFERENCES families(id);
ALTER TABLE wishlist_items      ADD COLUMN family_id INTEGER REFERENCES families(id);
ALTER TABLE settings            ADD COLUMN family_id INTEGER REFERENCES families(id);
```

### Migration strategy (safe, zero-data-loss)

1. Add `family_id` as nullable to all tables above
2. Create the first `families` row: `INSERT INTO families (id, slug) VALUES (1, 'atha-family')`
3. Create the matching `family_settings` row using the values currently in `.env`
4. Backfill all existing rows: `UPDATE activities SET family_id = 1 WHERE family_id IS NULL` (repeat for all tables)
5. Add `NOT NULL` constraints and `ON DELETE CASCADE` foreign keys
6. Add composite indices: `(family_id, is_active)` on activities, `(family_id, activity_id)` on votes

---

## API Routes (additions and changes for Initiative 5)

### New onboarding routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/{slug}/setup` | setup_token cookie | Onboarding wizard entry; validates token |
| POST | `/{slug}/setup/family-name` | setup_token | Save optional family name |
| POST | `/{slug}/setup/admin-password` | setup_token | Hash and store admin password |
| POST | `/{slug}/setup/pin` | setup_token | Hash and store child PIN |
| POST | `/{slug}/setup/copy-activities` | setup_token | Bulk-copy all seeded activities to this family |
| POST | `/{slug}/setup/memberships` | setup_token | Add memberships (returns 200 even if skipped) |
| POST | `/{slug}/setup/complete` | setup_token | Mark setup complete; issue full admin session cookie |

### New auth and management routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/{slug}/api/auth/pin-reset` | admin session | Validate admin password, set new PIN, invalidate child sessions |

### Existing routes — refactored

All existing `/api/*` routes become `/{slug}/api/*`. Every handler reads `family_id` from the session and adds it to all queries as a `WHERE family_id = ?` clause. The `/api/health` route remains global (no slug prefix).

---

## User Stories

### Operator — Family Creation

#### US-I5-OPS-1: Create a new family via CLI

**Scenario: Successful family creation**

Given the operator runs `npm run family:create-setup-link --slug="jones-family"`  
Then a new row is inserted into `families` with `slug = "jones-family"` and `is_active = true`  
And a one-time token is inserted into `setup_tokens` with `expires_at = now() + 48 hours`  
And the CLI outputs the full setup URL: `https://familyday.athafamily.com/jones-family/setup?token=<token>`  
And the operator shares this URL with the family via WhatsApp or SMS

**Scenario: Slug already exists**

Given the operator runs the command with a slug already in the `families` table  
Then the CLI exits with: "Family 'jones-family' already exists. Use --regenerate-token to issue a new setup link."  
And no duplicate row is created

---

#### US-I5-OPS-2: Regenerate a setup link for an existing family

**Scenario: New token issued**

Given the operator runs `npm run family:create-setup-link --slug="jones-family" --regenerate-token`  
And the family already exists but has not completed setup  
Then any previous unused token for this family is marked `is_used = true`  
And a new token is inserted with a fresh `expires_at`  
And the new setup URL is printed to stdout

---

### Onboarding — Parent

#### US-I5-SETUP-1: Visit setup link and see a welcome screen

**Scenario: Valid token**

Given the operator has shared a valid setup URL  
When the parent opens the URL in a browser  
Then the token is validated server-side (exists, not used, not expired)  
And a temporary `setup_token` session cookie is issued (valid for the setup session only)  
And the parent sees a welcome screen: "Welcome! Let's set up Days Out for your family."  
And a step indicator shows: Name → Password → PIN → Activities → Memberships → Done  
And a privacy policy checkbox is shown: "I've read and accept the Privacy Policy"  
And the "Next" button is disabled until the checkbox is ticked

**Scenario: Expired or used token**

Given the parent opens a setup URL where the token is expired or already used  
Then a 404 page is shown  
And no information is disclosed about the slug or the token status

---

#### US-I5-SETUP-2: Set an optional family name

**Scenario: Name provided**

Given the parent is on the family name step  
When they enter "Jones Family" (or any text up to 100 characters)  
And tap "Next"  
Then `families.name` is updated  
And `setup_progress.pin_set` remains unchanged (this step does not set the PIN)  
And the parent is taken to the admin password step

**Scenario: Name skipped**

Given the parent taps "Skip" or "Next" without entering a name  
Then `families.name` remains NULL  
And the parent is taken to the admin password step

---

#### US-I5-SETUP-3: Create an admin password during onboarding

**Scenario: Valid password**

Given the parent enters a password of at least 10 characters including one digit or symbol  
And taps "Next"  
Then the password is bcrypt-hashed (≥12 rounds) server-side  
And stored in `family_settings.admin_password_hash`  
And the parent is taken to the PIN creation step

**Scenario: Password too short or too weak**

Given the parent enters a password that does not meet the requirements  
Then an inline error is shown: "At least 10 characters, with a number or symbol"  
And the "Next" button remains disabled until requirements are met  
And the plaintext password is never logged

---

#### US-I5-SETUP-4: Create a child PIN during onboarding (entry)

**Scenario: PIN entered using numpad**

Given the parent is on the PIN creation step  
When they tap digits on the numpad (reusing the existing PIN entry component)  
Then filled circles represent entered digits and empty circles represent remaining capacity  
And after 4 digits the "Confirm" button becomes enabled  
And the parent can enter up to 6 digits before auto-submitting to the confirm step

---

#### US-I5-SETUP-4a: PIN too short shows a warning

**Scenario: Common or weak PIN nudge**

Given the parent enters a PIN that is sequential (1234, 5678) or all-same (1111)  
Then a non-blocking warning appears below the numpad: "Try something harder to guess"  
And the parent can still proceed — this is a nudge, not a block

---

#### US-I5-SETUP-4b: PIN confirm mismatch shows error and allows retry

**Scenario: Mismatched confirmation**

Given the parent has entered a PIN in step 1  
When they enter a different set of digits in the confirmation step  
Then an error message appears: "PINs don't match — try again"  
And the confirmation numpad is cleared  
And a "Back" link allows the parent to re-enter their original PIN  
And the PIN is not saved until both entries match

**Scenario: Matching confirmation**

Given the parent enters the same digits in both steps  
Then a green checkmark appears: "PIN set ✓"  
And `family_settings.family_pin_hash` is stored (bcrypt ≥12 rounds)  
And `setup_progress.pin_set` is set to `true`  
And the parent is taken to the activity selection step

---

#### US-I5-SETUP-5: Bulk-copy seeded activities into the family's namespace

**Scenario: Copy seeded activities**

Given the parent reaches the activity step  
And the parent confirms "Use the recommended starting list"  
Then all activities currently in the seeded global set are bulk-copied into `activities` with `family_id = this_family_id`  
And `setup_progress.activities_copied` is set to `true`  
And the parent sees a confirmation: "70 activities added to your list"  
And the parent is taken to the memberships step

**Scenario: Start blank**

Given the parent selects "I'll add activities myself"  
Then no activities are copied  
And `setup_progress.activities_copied` remains false  
And the parent is taken to the memberships step  
And the admin dashboard will show an empty activity list with a prompt to add activities

---

#### US-I5-SETUP-6: Add memberships during onboarding (skippable)

**Scenario: Membership added**

Given the parent is on the memberships step  
When they enter a membership name (e.g., "National Trust"), optional description, and optional expiry date  
And tap "Save"  
Then a membership row is inserted into `memberships` with `family_id = this_family_id`  
And `setup_progress.memberships_seen` is set to `true`  
And the parent can add another or proceed

**Scenario: Step skipped**

Given the parent taps "Skip for now"  
Then `setup_progress.memberships_seen` is set to `true`  
And no membership rows are created  
And the parent can add memberships later from the admin panel

---

#### US-I5-SETUP-7: Reach confirmation screen and redirect to admin dashboard

**Scenario: Setup complete**

Given the parent reaches the confirmation screen  
When they tap "Go to admin panel"  
Then `setup_progress.completed_at` is set to the current timestamp  
And the setup token is marked `is_used = true`  
And the temporary `setup_token` session is invalidated  
And a full admin session cookie is issued (role=admin, family_id=this_family_id)  
And the parent is redirected to `/{slug}/admin`  
And the admin dashboard is visible and scoped to their family

---

#### US-I5-SETUP-8: Expired or already-used setup token shows 404

**Scenario: Used or expired token**

Given a parent navigates to a setup URL with a token that is already used or past its expiry  
Then the server returns a 404 response  
And no setup form is shown  
And no information is disclosed about whether the family exists or the token ever existed

---

#### US-I5-SETUP-9: Abandoned setup — resume via admin login

**Scenario: PIN set but activities not copied**

Given a parent completed PIN setup (step 4) but closed the browser before step 5  
When the parent later logs into `/{slug}/login` with their admin password  
Then a banner appears on the admin dashboard: "Your setup isn't finished. [Resume setup →]"  
And clicking the banner takes the parent to the next incomplete setup step  
And the banner can be dismissed if the parent prefers to set up manually

---

### Authentication — Multi-Family

#### US-I5-AUTH-1: Invalid slug returns 404

**Scenario: Unknown slug**

Given a user navigates to a path with an unknown slug (e.g., `/unknown-family/pin`)  
Then the server returns a 404 response  
And no information is disclosed about which slugs exist

---

#### US-I5-AUTH-2: Child PIN authentication is family-scoped

**Scenario: Correct PIN**

Given a child visits `/{slug}/pin`  
When they enter the correct PIN for that family  
Then a signed HttpOnly SameSite=Strict JWT session cookie is issued  
And the token contains `role: "pin"` and `family_id: <this_family_id>`  
And the child is redirected to `/{slug}/`

**Scenario: Wrong PIN**

Given a child enters an incorrect PIN  
Then the error message "Incorrect PIN" is shown  
And the attempt is counted against the rate limit for `pin:{family_id}:{ip}`  
And after 5 incorrect attempts from the same IP within 60 seconds, the 6th returns HTTP 429  
And the page shows: "Too many attempts — try again in a minute"

---

#### US-I5-AUTH-3: Parent admin authentication is family-scoped

**Scenario: Correct admin password**

Given a parent visits `/{slug}/login`  
When they submit the correct admin password for that family  
Then a signed HttpOnly SameSite=Strict JWT admin session cookie is issued  
And the token contains `role: "admin"` and `family_id: <this_family_id>`  
And the parent is redirected to `/{slug}/admin`

**Scenario: Wrong password**

Given a parent submits an incorrect admin password  
Then "Incorrect password" is shown  
And the attempt is counted against `admin:{family_id}:{ip}`  
And after 5 attempts within 60 seconds, the 6th returns HTTP 429

---

#### US-I5-AUTH-4: Admin session cannot access a different family's admin

**Scenario: Cross-family admin attempt**

Given a parent is authenticated as admin for Family A (`family_id = 1`)  
When they navigate directly to `/{slug-B}/admin`  
Then the server returns HTTP 403 (Forbidden)  
And the admin dashboard for Family B is not shown

---

#### US-I5-AUTH-5: Child session cannot access a different family's browse screen

**Scenario: Cross-family child access attempt**

Given a child is authenticated as PIN for Family A (`family_id = 1`)  
When they navigate directly to `/{slug-B}/`  
Then the middleware detects the family_id mismatch  
And the child is redirected to `/{slug-B}/pin` (Family B's PIN screen)  
And Family A's activities, votes, and passport are not shown

---

#### US-I5-AUTH-6: Rate limits are per-family per-IP

**Scenario: Family A lockout does not affect Family B**

Given a child on Family A enters the wrong PIN 5 times within 60 seconds  
And a child on Family B (different family_id, same external IP) tries to enter their PIN  
Then Family B's PIN entry is allowed (their rate limit counter is independent)  
And Family A's PIN entry returns HTTP 429 on the 6th attempt  
And Family B's counter is unaffected

---

### Data Isolation

#### US-I5-DATA-1: Activity browse is family-scoped

**Scenario: Child sees only their family's activities**

Given Family A has 70 copied seeded activities and 2 custom activities  
And Family B has 70 copied seeded activities and 5 custom activities  
When a child from Family A visits `/{slug-A}/`  
Then they see exactly Family A's 72 activities  
And none of Family B's 75 activities appear  
And the query used is `WHERE family_id = <family_A_id>`

---

#### US-I5-DATA-2: Votes are family-scoped

**Scenario: Vote tally is isolated**

Given Family A's child votes 👍 on activity "Brimham Rocks" (Family A's copy)  
And Family B's child votes 😴 on their own copy of "Brimham Rocks"  
When Family A's admin views the vote summary  
Then "Brimham Rocks" shows 1 × 👍 and 0 × 😴  
When Family B's admin views the vote summary  
Then "Brimham Rocks" shows 0 × 👍 and 1 × 😴

---

#### US-I5-DATA-3: Passport stamps are family-scoped

**Scenario: Stamps do not bleed across families**

Given Family A visited "Harewood House" and created a passport stamp  
When Family B's child visits `/{slug-B}/passport`  
Then "Harewood House" does not appear in Family B's passport  
And the query used is `WHERE passport_stamps.family_id = <family_B_id>`

---

#### US-I5-DATA-4: Wishlists are family-scoped

**Scenario: Heart icon state is family-specific**

Given Family A has "Cannon Hall Farm" in their wishlist  
When a child from Family B browses activities and views "Cannon Hall Farm"  
Then the heart icon is not filled (it is not in Family B's wishlist)  
And Family B hearting the activity creates a wishlist row with `family_id = <family_B_id>`

---

#### US-I5-DATA-5: Memberships are family-scoped

**Scenario: Membership badge only appears for the owning family**

Given Family A has a National Trust membership linked to "Brimham Rocks"  
And Family B has no NT membership  
When Family A's child views "Brimham Rocks" detail  
Then the cost badge reads "FREE w/ National Trust"  
When Family B's child views "Brimham Rocks" detail  
Then the cost badge shows the standard cost tier (no membership override)

---

#### US-I5-DATA-6: Admin dashboard counts are family-scoped

**Scenario: Dashboard shows only this family's data**

Given Family A has 72 activities, 14 votes this week, and 2 memberships  
And Family B has 75 activities, 30 votes this week, and 1 membership  
When Family A's admin visits `/{slug-A}/admin`  
Then the activity count shows 72  
And the vote summary shows Family A's 14 votes  
And the membership expiry section shows Family A's 2 memberships  
And no data from Family B is visible

---

### Self-Service PIN Reset

#### US-I5-PIN-1: "Forgot PIN?" link on PIN screen

**Scenario: Parent spots the recovery link**

Given a parent visits `/{slug}/pin`  
Then a "Forgot PIN?" link is visible below the numpad  
And tapping it opens a form: "Enter your admin password to reset the PIN"

---

#### US-I5-PIN-2: Admin password validates identity

**Scenario: Correct admin password**

Given the parent enters the correct admin password in the PIN reset form  
Then the parent is taken to a PIN creation screen (same numpad, same confirm step as onboarding)

**Scenario: Wrong admin password**

Given the parent enters an incorrect admin password  
Then an error is shown: "Incorrect admin password"  
And the attempt is counted against the admin rate limit for this family

---

#### US-I5-PIN-3: New PIN creation (same rules as onboarding)

**Scenario: PIN created and confirmed**

Given the parent enters a new PIN and confirms it (both match)  
Then `family_settings.family_pin_hash` is updated with the new bcrypt hash  
And `setup_progress` is not affected  
And the parent is shown: "PIN updated. Give the new PIN to your children."

---

#### US-I5-PIN-4: Old child sessions are invalidated

**Scenario: Children must re-enter the new PIN**

Given a PIN reset is completed  
Then all existing PIN-role session cookies for this family are invalidated  
When a child on a device with an old session visits `/{slug}/`  
Then they are redirected to `/{slug}/pin`  
And they must enter the new PIN to continue

---

### Operator — Management CLI

#### US-I5-CLI-1: Reset a family's admin password

**Scenario: Successful reset**

Given the operator runs `npm run family:reset-password --slug="jones-family"`  
And the family exists in the `families` table  
Then the CLI prompts: "Enter new admin password:"  
When the operator types a password meeting the requirements (10+ chars, 1+ digit or symbol)  
Then the password is bcrypt-hashed and stored in `family_settings.admin_password_hash`  
And all admin sessions for `jones-family` are invalidated  
And the CLI prints: "Admin password for jones-family has been reset."  
And no other family's credentials are affected

**Scenario: Family not found**

Given the operator runs the command with a slug that does not exist  
Then the CLI exits with: "Family 'unknown-family' not found."

---

#### US-I5-CLI-2: Hard-delete all data for a family (right-to-erasure)

**Scenario: Successful deletion**

Given the operator runs `npm run family:delete --slug="jones-family"`  
And the family exists  
Then the CLI prompts: "This will permanently delete all data for jones-family. Type the slug to confirm:"  
When the operator types "jones-family"  
Then all rows with `family_id = <jones_family_id>` are deleted from: votes, passport_stamps, wishlist_items, activity_memberships, family_memberships, memberships, activities, settings, setup_progress, setup_tokens, family_settings  
And the `families` row is deleted  
And the CLI prints a deletion report: `Deleted: 72 activities, 45 votes, 18 stamps, 1 membership, ...`  
And no data from any other family is affected

**Scenario: Confirmation mismatch**

Given the operator is prompted to type the slug  
When they type a different string  
Then the CLI exits with: "Confirmation did not match. No data deleted."

---

### Privacy and Compliance

#### US-I5-PRIV-1: Privacy policy is accessible without authentication

**Scenario: Public policy page**

Given a user (authenticated or not) navigates to `/{slug}/privacy`  
Then the privacy policy is rendered as a static page  
And no login is required  
And the middleware does not redirect to `/pin` or `/login`  
And the content is human-readable (no legalese — plain English)

---

#### US-I5-PRIV-2: Privacy policy acknowledgement during onboarding

**Scenario: Checkbox required before proceeding**

Given the parent is on the onboarding welcome screen  
Then a checkbox is shown: "I have read and accept the Privacy Policy [link]"  
And the "Next" button is disabled until the checkbox is ticked  
When the parent ticks the checkbox  
Then the "Next" button becomes enabled  
And the acceptance is recorded server-side: `setup_progress.privacy_accepted = true`

---

#### US-I5-PRIV-3: Parental consent template available to operator

**Scenario: Operator can find the consent template**

Given the operator wants to onboard a new family  
Then `business/consent-template.md` contains a ready-to-send email template  
And the template covers: what data is collected, how it is used, right to deletion, how to request deletion  
And the operator sends this to the parent before sharing the setup link  
And the parent's reply constitutes written consent (operator keeps the email thread as a record)

---

## Success Metrics

| Metric | Target | How Verified |
|--------|--------|--------------|
| Onboarding time | <5 minutes per family | Operator times each session from "link sent" to "setup complete" |
| Data isolation | 100% — no cross-family leakage | Spot-check SQL queries after each family onboards |
| PIN/admin reset | Operator resets either in <2 minutes via CLI | Tested before any family is onboarded |
| Seeded activity copy | All 70+ activities visible in each family's browse screen | `SELECT COUNT(*) FROM activities WHERE family_id = ?` |
| No production incidents | Zero unplanned downtime in the 4-week pilot | Operator checks `/api/health` daily |

---

## Rollout Sequence

1. **Schema migration** — run on a copy of prod DB first; verify all row counts match; backup prod before applying
2. **Backfill existing data** — assign all current rows to `family_id = 1` (the original family)
3. **Smoke test** — verify existing family still works exactly as before on the new schema
4. **Onboard Family 2** — operator creates setup link; parent self-serves; operator spot-checks DB
5. **Onboard Family 3** — repeat
6. **4-week pilot** — monitor logs daily; weekly check-in with each family

### Go/No-Go criteria (pilot success)

All must pass:
- All 3 families onboarded without operator intervention beyond sending the link
- SQL spot-checks confirm zero cross-family data rows
- Auth bypass test: admin of Family A cannot access `/{slug-B}/admin`
- PIN reset workflow tested successfully on one family
- `npm run family:delete` tested on a throwaway test family before pilot begins
- Zero incidents (no crashes, no 500 errors, no data corruption) in the pilot period
