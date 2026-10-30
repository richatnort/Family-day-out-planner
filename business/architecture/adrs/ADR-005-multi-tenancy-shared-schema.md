# ADR-005: Multi-Tenancy via Shared PostgreSQL Schema with family_id

**Status:** Accepted
**Date:** 2026-05-09
**Approved by:** ADR Board — Product Manager, Principal Solution Architect, Principal Engineer, Business Analyst (all approved)
**Initiative:** Initiative 5 — Multi-Family Scalability

---

## Context

Days Out in Summer is being extended from a single-family app to a 3-family pilot. The database currently holds activities, votes, passport stamps, wishlists, memberships, and settings for one family. Adding multiple families requires every query to return only the requesting family's data with zero possibility of cross-family leakage.

Three isolation models were evaluated. The chosen approach must be compatible with Drizzle ORM (which does not support per-schema migration orchestration natively), must work within a single Docker Compose PostgreSQL service, and must follow the generate → commit → migrate workflow mandated by the architecture best practices.

---

## Options Considered

### Option A: Shared schema with family_id discriminator on every tenant-scoped table (chosen)

- Adds `family_id INTEGER NOT NULL REFERENCES families(id)` to all tenant-scoped tables
- Every query includes `WHERE family_id = session.familyId`
- Single Drizzle ORM instance, one migration file set
- Migration strategy is a safe, zero-data-loss three-phase process: add nullable → backfill in place → add NOT NULL + FK
- Hard-delete for GDPR Article 17: `DELETE FROM <tables> WHERE family_id = ?` in dependency order, then `DELETE FROM families WHERE id = ?`
- Proven pattern at this scale; works cleanly with Drizzle's typed query builder

### Option B: Separate PostgreSQL schema per family (e.g. `jones_family.activities`) (rejected)

- Each family gets their own PG schema (`CREATE SCHEMA jones_family`)
- No `WHERE family_id` clause — schema name provides isolation
- Drizzle ORM has no built-in multi-schema migration orchestration; each schema's tables must be migrated separately via raw SQL or a custom runner
- Requires dynamic schema provisioning at family creation time (DDL at runtime)
- Does not compose with `drizzle-kit generate` — violates the generate → commit → migrate workflow
- Rejected

### Option C: Separate PostgreSQL database per family (rejected)

- Full isolation: each family has their own connection string and PostgreSQL database
- Requires one Docker Compose DB service per family or a connection multiplexer
- Operational surface area grows linearly with family count — unacceptable for a solo operator
- Triples the migration scope on every schema change
- Rejected

---

## Decision

Use a **shared PostgreSQL schema with a `family_id` discriminator column** on every tenant-scoped table. This is the simplest approach that works with Drizzle's migration tooling, requires no new infrastructure, and enforces complete data isolation at query time.

---

## New Tables

```sql
-- One row per family. Slug is the URL routing key (see ADR-007).
CREATE TABLE families (
  id         SERIAL PRIMARY KEY,
  name       TEXT,                             -- optional, e.g. "Jones Family"
  slug       TEXT NOT NULL UNIQUE,             -- IMMUTABLE after creation (see ADR-007)
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Bcrypt hashes for this family's PIN and admin password (see ADR-006).
-- pin_session_version increments on PIN reset to invalidate child sessions.
CREATE TABLE family_settings (
  family_id            INTEGER PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  family_pin_hash      TEXT NOT NULL,
  admin_password_hash  TEXT NOT NULL,
  pin_session_version  INTEGER NOT NULL DEFAULT 1,
  updated_at           TIMESTAMP NOT NULL DEFAULT now()
);

-- One-time setup tokens. Single-use, 48h TTL.
CREATE TABLE setup_tokens (
  id         SERIAL PRIMARY KEY,
  family_id  INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  is_used    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  expires_at TIMESTAMP NOT NULL
);

-- Onboarding checkpoint state. Enables resume if parent closes browser mid-setup.
CREATE TABLE setup_progress (
  family_id           INTEGER PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  privacy_accepted    BOOLEAN NOT NULL DEFAULT false,  -- GDPR Art. 7: must be true before any family data is written
  pin_set             BOOLEAN NOT NULL DEFAULT false,
  activities_copied   BOOLEAN NOT NULL DEFAULT false,
  memberships_seen    BOOLEAN NOT NULL DEFAULT false,
  completed_at        TIMESTAMP                        -- NULL until setup is fully done
);
```

---

## Altered Tables

The following existing tables gain a `family_id` column. `activity_memberships` is deliberately excluded — it is a junction table linking activities to memberships. Both of those tables are already family-scoped, so isolation is enforced by joining through `activities WHERE family_id = ?`, not by a redundant column on the junction table (see Implementation Requirement 4).

| Table | Change |
|-------|--------|
| `activities` | Add `family_id INTEGER NOT NULL REFERENCES families(id)` |
| `memberships` | Add `family_id INTEGER NOT NULL REFERENCES families(id)` |
| `family_memberships` | Add `family_id INTEGER NOT NULL REFERENCES families(id)` |
| `votes` | Add `family_id INTEGER NOT NULL REFERENCES families(id)` |
| `passport_stamps` | Add `family_id INTEGER NOT NULL REFERENCES families(id)` |
| `wishlist_items` | Add `family_id INTEGER NOT NULL REFERENCES families(id)` |
| `settings` | Add `family_id INTEGER NOT NULL REFERENCES families(id)`. Primary key changes from `key TEXT` to composite `(family_id, key)`. |

---

## Implementation Requirements

1. **Drizzle migration ordering.** The `families` table must be defined first in `db/schema.ts` before any table that holds a `family_id` FK reference. `drizzle-kit generate` produces SQL in schema definition order — if `families` appears after `activities`, the generated migration will attempt to add the FK before the referenced table exists and will fail.

2. **Migration is a four-phase process — use `UPDATE`, not `INSERT INTO ... SELECT`.** Adding `family_id` is a column backfill, not a row copy. Never duplicate rows to backfill a new column.

   ```sql
   -- Phase 1: add nullable column to all tenant-scoped tables
   ALTER TABLE activities         ADD COLUMN family_id INTEGER REFERENCES families(id);
   ALTER TABLE memberships        ADD COLUMN family_id INTEGER REFERENCES families(id);
   ALTER TABLE family_memberships ADD COLUMN family_id INTEGER REFERENCES families(id);
   ALTER TABLE votes              ADD COLUMN family_id INTEGER REFERENCES families(id);
   ALTER TABLE passport_stamps    ADD COLUMN family_id INTEGER REFERENCES families(id);
   ALTER TABLE wishlist_items     ADD COLUMN family_id INTEGER REFERENCES families(id);
   ALTER TABLE settings           ADD COLUMN family_id INTEGER REFERENCES families(id);

   -- Phase 2: create the original family row and migrate existing credentials
   INSERT INTO families (id, slug, is_active) VALUES (1, 'atha-family', true);
   INSERT INTO family_settings (family_id, family_pin_hash, admin_password_hash)
     VALUES (1, '<FAMILY_PIN_HASH from .env>', '<ADMIN_PASSWORD_HASH from .env>');

   -- Phase 3: backfill all existing rows in place (UPDATE, not INSERT/SELECT)
   UPDATE activities         SET family_id = 1 WHERE family_id IS NULL;
   UPDATE memberships        SET family_id = 1 WHERE family_id IS NULL;
   UPDATE family_memberships SET family_id = 1 WHERE family_id IS NULL;
   UPDATE votes              SET family_id = 1 WHERE family_id IS NULL;
   UPDATE passport_stamps    SET family_id = 1 WHERE family_id IS NULL;
   UPDATE wishlist_items     SET family_id = 1 WHERE family_id IS NULL;
   UPDATE settings           SET family_id = 1 WHERE family_id IS NULL;

   -- Phase 4: add NOT NULL constraint and FK on each table
   ALTER TABLE activities         ALTER COLUMN family_id SET NOT NULL;
   ALTER TABLE memberships        ALTER COLUMN family_id SET NOT NULL;
   ALTER TABLE family_memberships ALTER COLUMN family_id SET NOT NULL;
   ALTER TABLE votes              ALTER COLUMN family_id SET NOT NULL;
   ALTER TABLE passport_stamps    ALTER COLUMN family_id SET NOT NULL;
   ALTER TABLE wishlist_items     ALTER COLUMN family_id SET NOT NULL;
   ALTER TABLE settings           ALTER COLUMN family_id SET NOT NULL;

   -- Phase 5: change settings primary key to composite
   ALTER TABLE settings DROP CONSTRAINT settings_pkey;
   ALTER TABLE settings ADD PRIMARY KEY (family_id, key);
   ```

3. **Required indices** (add after Phase 4):

   ```sql
   CREATE INDEX ON activities         (family_id, is_active);
   CREATE INDEX ON votes              (family_id, activity_id);
   CREATE INDEX ON memberships        (family_id);
   CREATE INDEX ON family_memberships (family_id);
   CREATE INDEX ON passport_stamps    (family_id);
   CREATE INDEX ON wishlist_items     (family_id);
   CREATE INDEX ON setup_tokens       (expires_at);   -- for expired-token cleanup queries
   ```

4. **`activity_memberships` is explicitly unscoped — queries must anchor via activities.** This junction table must not receive a `family_id` column; adding one would be denormalisation. Every query that touches `activity_memberships` must join through the family-scoped `activities` table:

   ```sql
   SELECT am.* FROM activity_memberships am
   JOIN activities a ON a.id = am.activity_id
   WHERE a.family_id = $family_id;
   ```

   Add a comment in `db/schema.ts` at the `activityMemberships` definition documenting this pattern, to prevent a future developer from "fixing" it by adding a redundant column.

5. **Seed data copy model (D-I5-01).** At onboarding Step 5, all seeded activities are bulk-copied into the new family's namespace. The seed function in `db/seed.ts` must be parameterised by `family_id`:

   ```ts
   export async function seedActivities(familyId: number) { ... }
   ```

   Do not query `WHERE family_id IS NULL` — no such rows exist after the Phase 3 backfill. The onboarding handler calls `seedActivities(newFamilyId)` to populate the new family's activity list.

6. **Hard-delete manifest for GDPR Article 17.** The `npm run family:delete` CLI must delete rows in dependency order. `ON DELETE CASCADE` handles `family_settings`, `setup_tokens`, and `setup_progress` automatically when the `families` row is deleted, but explicit deletes for all other tables must precede it to produce an accurate deletion report:

   ```
   1. passport_stamps       WHERE family_id = ?
   2. votes                 WHERE family_id = ?
   3. wishlist_items        WHERE family_id = ?
   4. activity_memberships  via JOIN activities WHERE activities.family_id = ?
   5. family_memberships    WHERE family_id = ?
   6. memberships           WHERE family_id = ?
   7. activities            WHERE family_id = ?
   8. settings              WHERE family_id = ?
   9. families              WHERE id = ?  (cascades: family_settings, setup_tokens, setup_progress)
   ```

   The CLI must print a deletion report: `Deleted: 72 activities, 45 votes, 18 stamps, ...`

7. **Backup before migration.** Before running the migration on the production PostgreSQL instance, take a full `pg_dump`. See ADR-003 for the procedure. The migration alters primary keys (`settings`) and adds NOT NULL constraints — rollback requires restoring from backup if it fails mid-migration.

8. **Smoke test after migration.** Verify the existing family (id=1) works correctly after migration completes. All activity counts, vote tallies, passport stamps, and admin dashboard figures must match their pre-migration state before onboarding any new family.

---

## Caveats

- **A missing `WHERE family_id` clause is a silent data leak, not an error.** All API Route Handlers and Server Components must be audited on review. Drizzle's typed query builder does not enforce the filter at compile time.
- **At 3 families with 70 seeded activities each, the activities table holds ~210 rows.** PostgreSQL handles this trivially. The composite indices are precautionary for future growth, not a current performance requirement.
- **Phase 2 inserts the existing hashes in plaintext SQL.** Run this migration locally in a transaction, or use a migration script that reads from the environment rather than embedding values in the SQL file. The SQL migration file must never be committed with real hash values — use a parameterised script instead.

---

## Revisit If

- Family count exceeds 10 and cross-family query audit gaps become a concern — consider a TypeScript wrapper that enforces `family_id` scoping at the type level
- Regulatory data residency requirements emerge for any family — reconsider Option B (per-PG-schema) with a custom Drizzle migration runner
- PostgreSQL connection pool becomes a bottleneck (see ADR-003 Revisit If — PgBouncer deferred until needed)
