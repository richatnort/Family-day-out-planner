# ADR-007: Family-Scoped URL Routing via Slug Prefix

**Status:** Accepted
**Date:** 2026-05-09
**Approved by:** ADR Board — Product Manager, Principal Solution Architect, Principal Engineer, Business Analyst (all approved)
**Initiative:** Initiative 5 — Multi-Family Scalability

---

## Context

With multiple families sharing the same Next.js app, the app must route each family to their own set of pages and API endpoints. The routing mechanism must:

- Identify which family a request belongs to from the URL
- Prevent one family's session from accessing another family's data
- Return 404 for unknown families with no information about which families exist
- Work with the existing Cloudflare Tunnel without additional DNS or TLS configuration
- Allow children to bookmark a single URL they navigate to every day

---

## Options Considered

### Option A: URL slug prefix `/{slug}/` — Next.js App Router dynamic segment (chosen)

- Each family is assigned a unique, immutable slug (e.g. `jones-family`) when the operator creates their account via CLI
- All family-specific routes live under `app/[slug]/` in the Next.js file system
- Routes: `/{slug}/`, `/{slug}/pin`, `/{slug}/login`, `/{slug}/admin`, `/{slug}/setup`, `/{slug}/privacy`
- Middleware validates slug against the `families` table; invalid or unknown slugs return HTTP 404 — no redirect, no error detail
- `/{slug}/api/*` replaces all existing `/api/*` routes (except `/api/health` which stays global)
- Children bookmark `/{slug}/` once; it goes directly to the PIN screen on every visit
- Operator sends the full setup URL once via WhatsApp/SMS: `https://familyday.athafamily.com/{slug}/setup?token=<token>`

### Option B: Subdomain routing `{slug}.familyday.athafamily.com` (rejected)

- Requires a Cloudflare wildcard DNS record and wildcard TLS certificate
- Cloudflare Tunnel wildcard routing requires additional configuration beyond the current single-hostname setup
- Next.js App Router dynamic segments operate on URL paths, not hostnames — subdomain detection requires custom `Host` header parsing in middleware, which is non-standard and fragile
- Rejected on operational complexity grounds

### Option C: Family code at shared PIN screen (rejected)

- All families visit the same URL; children type a family code before their PIN
- Children must remember two things (family code and PIN), not one — added friction for children aged 4+
- A shared landing page implicitly reveals that multiple families use the app
- Rejected on UX and information-disclosure grounds

### Option D: Family selector dropdown on shared landing page (rejected)

- All families visit the same URL and select their family from a list
- The list itself exposes which families are registered — information disclosure
- Rejected on privacy grounds

### Option E: Query parameter `/?family=jones-family` (rejected)

- Bookmarkable in theory but query parameters are stripped by some link-preview tools and messaging apps
- Not matched by Next.js App Router file-system routing — requires custom query parsing on every page
- Rejected

---

## Decision

Use **`/{slug}/` as a path prefix**, implemented as an `app/[slug]/` dynamic segment in Next.js App Router. Middleware validates the slug on every request and attaches `family_id` to the request headers before any page or handler processes it.

---

## Implementation Requirements

1. **File system structure.** All family-specific pages and API routes move under `app/[slug]/`. Next.js resolves static segments before dynamic segments — `app/api/health/route.ts` is a static segment and takes routing precedence over `app/[slug]/` for `/api/health` requests. The global health check requires no special treatment:

   ```
   app/
     api/
       health/
         route.ts         → /api/health  (global — stays here, never moves)
     [slug]/
       page.tsx           → /{slug}/
       pin/
         page.tsx         → /{slug}/pin
       login/
         page.tsx         → /{slug}/login
       admin/
         page.tsx         → /{slug}/admin
       setup/
         page.tsx         → /{slug}/setup
       privacy/
         page.tsx         → /{slug}/privacy  (no auth required — see requirement 7)
       api/
         auth/
           [...nextauth]/
             route.ts     → /{slug}/api/auth/*
         activities/
           route.ts       → /{slug}/api/activities
         votes/
           route.ts       → /{slug}/api/votes
         (etc. — all existing /api/* routes move here)
   ```

2. **Middleware must run in Node.js runtime, not Edge.** Drizzle ORM with `node-postgres` is not compatible with the Next.js Edge runtime. Declare this explicitly in `middleware.ts`:

   ```ts
   export const runtime = 'nodejs';
   ```

   Without this declaration, the middleware will fail when attempting a PostgreSQL query.

3. **Middleware matcher — exclude Next.js internals and the global health endpoint.**

   ```ts
   export const config = {
     matcher: [
       '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
     ],
   };
   ```

   This prevents static assets, image optimisation routes, and the global health endpoint from triggering the slug DB lookup.

4. **Slug→family_id resolution with in-process cache.** Because slugs are immutable after creation, the middleware may cache resolved slugs in a module-level Map to avoid a DB round-trip on every request. Three families will produce three cache entries and never evict:

   ```ts
   // Never expires — slugs are immutable; restarts clear the cache (correct behaviour)
   const slugCache = new Map<string, number | null>();

   export async function middleware(request: NextRequest) {
     const slug = request.nextUrl.pathname.split('/')[1];
     if (!slug) return NextResponse.next();

     let familyId = slugCache.get(slug);
     if (familyId === undefined) {
       const result = await db
         .select({ id: families.id })
         .from(families)
         .where(and(eq(families.slug, slug), eq(families.isActive, true)))
         .limit(1);
       familyId = result[0]?.id ?? null;
       slugCache.set(slug, familyId);
     }

     if (familyId === null) {
       return new NextResponse(null, { status: 404 });
     }

     // Strip any client-supplied x-family-id, then set from resolved value
     const requestHeaders = new Headers(request.headers);
     requestHeaders.delete('x-family-id');
     requestHeaders.set('x-family-id', String(familyId));

     return NextResponse.next({ request: { headers: requestHeaders } });
   }
   ```

5. **`x-family-id` internal header — strip-and-rewrite is mandatory.** The middleware must delete any client-supplied `x-family-id` value before setting it from its own DB-backed resolution. A client that forges this header would otherwise be able to access a different family's data from any slug URL. Server Components and Route Handlers must read `family_id` exclusively from this middleware-set header via `headers().get('x-family-id')` — never from URL parameters, query strings, or request body directly.

6. **Reserved slug blocklist — enforced at family registration time.** The `npm run family:create-setup-link` CLI command must reject reserved slugs before inserting a `families` row. Enforcing this at registration time is essential — middleware-level collision detection is too late and creates ambiguous routing behaviour:

   ```ts
   const RESERVED_SLUGS = new Set([
     'api', '_next', 'health', 'pin', 'login', 'admin',
     'setup', 'privacy', 'favicon', 'robots', 'sitemap',
   ]);

   if (RESERVED_SLUGS.has(slug)) {
     console.error(`'${slug}' is a reserved path and cannot be used as a family slug.`);
     process.exit(1);
   }
   ```

7. **Privacy policy route — exempt from authentication checks.** `/{slug}/privacy` must be publicly accessible without a PIN or admin session. The middleware applies slug validation (returning 404 for an unknown slug), but the page component must not include an `auth()` guard or redirect to `/pin` or `/login`. This satisfies US-I5-PRIV-1.

8. **Parental consent integration.** The `/{slug}/setup` wizard Step 1 must render a privacy policy checkbox. The server records acceptance before any family data is processed:

   - Step 1 page renders the checkbox: "I have read and accept the Privacy Policy [link to `/{slug}/privacy`]"
   - The "Next" button is disabled until the checkbox is ticked
   - On submit, the server sets `setup_progress.privacy_accepted = true`
   - All subsequent setup step handlers (`POST /{slug}/setup/admin-password`, etc.) must validate `setup_progress.privacy_accepted === true` before processing. Return HTTP 403 if the flag is not set.

   The parental consent email template (`business/consent-template.md`) is an out-of-band pre-condition: the operator must send it and receive the parent's reply before running `npm run family:create-setup-link`. The CLI does not technically enforce this, but its documentation must state it.

9. **Cross-family session isolation.** After the middleware sets `x-family-id`, API Route Handlers and Server Components must compare the session `familyId` claim against the middleware-provided header:

   - If they match → process the request normally
   - Admin cross-family access (`role: "admin"`, session `familyId ≠ x-family-id`) → return HTTP 403
   - Child cross-family access (`role: "pin"`, session `familyId ≠ x-family-id`) → redirect to `/{slug}/pin` (the target family's PIN screen, not a 403). Children who follow a link to the wrong family's URL should be able to log in there, not see an error.

10. **Slug immutability — enforced at schema level and in CLI.** The `slug` column must have no `UPDATE` path in any CLI command or admin UI. Add a comment to the Drizzle schema:

    ```ts
    slug: text('slug').notNull().unique(),  // IMMUTABLE — never update after creation
    ```

    **Slug deletion behaviour:** When a family is deleted via `npm run family:delete`, their slug is removed from the `families` table. Bookmarks to `/{slug}/` correctly return 404. Slugs are not recycled — a deleted slug cannot be reused for a new family to prevent session or bookmark confusion. If an operator must reuse a slug, they must contact all previous holders of that URL out-of-band.

    **Post-delete cache eviction:** The middleware slug cache is module-level (per Node.js process). After a family is deleted, the container must be restarted to evict the stale cache entry. The `npm run family:delete` CLI must print: `"Restart the app container to clear the slug cache: docker compose restart app"`.

---

## Caveats

- **Every request through `[slug]/` triggers middleware.** With the in-process cache, all slugs after the first request are served from memory (no DB round-trip). The only overhead per cached request is the Map lookup and header manipulation — both negligible.
- **`app/[slug]/` greedily matches any first path segment** not claimed by a static sibling in `app/`. Any new top-level static segment added to the app in the future (e.g. `/about`) must be placed as a static directory in `app/about/` (which takes routing precedence over `[slug]`) and added to the reserved slug blocklist.
- **The setup wizard lives inside `[slug]/`** because the family slug exists before the parent visits the setup URL. The CLI creates the `families` row first (slug assigned), then generates the setup token. The parent visits `/{slug}/setup?token=<token>`, which is within `app/[slug]/setup/`. This is correct — no special routing for setup is needed outside the `[slug]` segment.

---

## Revisit If

- A family requests a URL without the slug prefix (e.g. `familyday.athafamily.com/` as their home page) → consider subdomain routing (Option B), requiring Cloudflare Tunnel reconfiguration
- The slug cache causes stale-data issues in practice (e.g. operator updates a family's `is_active` flag without restarting) → add a short TTL (e.g. 5 minutes) to cache entries
- The reserved slug blocklist grows unwieldy → enforce a slug format constraint at registration: kebab-case only, 3–30 characters, regex `/^[a-z][a-z0-9-]{2,29}$/`
