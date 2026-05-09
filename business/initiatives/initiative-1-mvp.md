# Initiative 1: MVP — Children's Interface

**Status:** Ready for review  
**Date finalised:** 2026-05-03  
**Dependencies:** ADR-001, ADR-002, ADR-003, ADR-004 (all Accepted)  
**Reviewed by:** 5-agent board (UX Engineer, Business Analyst, Principal React Engineer, Software Engineering Tester, Solution Architect)

---

## Scope

Everything a child can do with the 70+ seeded activities. No parent admin panel. No Groq.

**In scope:**
- PIN authentication
- Activity browsing (alphabetical, filterable by weather, setting, and cost tier)
- Activity detail (OG image, map, cost badge, voting, Add to Calendar, mark as visited)
- Wishlist (heart on cards)
- Adventure Passport (stamps grid, progress bar)
- Family Vote page
- Health endpoint

**Out of scope (later initiatives):**
- Parent admin panel and activity CRUD (Initiative 2)
- Membership management UI (Initiative 2)
- `is_considering` / This Week's Plan / `/plan` page (Initiative 2)
- Groq URL import (Initiative 3)
- Post-visit photos — `photo_url` deferred to Initiative 3
- Weather API, distance calculations (Initiative 4)

---

## Decisions Made During Review

These resolve conflicts and gaps identified by the 5-agent board.

### D-01: Wishlist Persistence — server-side
**Decision:** `wishlist_items` table, `activity_id` only. Single-family app — the family shares one wishlist.  
**Rejected:** localStorage (fails "persists across sessions" on different devices).  
**Schema addition:** see Schema Changes section below.

### D-02: Voter Identity — localStorage name prompt
**Decision:** Voter name is entered once, stored in `localStorage` under `days-out-voter-name`. The child is prompted "What's your name?" before their first vote action. The name persists on that device indefinitely. If empty, any vote action re-triggers the prompt.  
**Rejected:** Named user accounts (no user model exists); anonymous votes (can't implement vote replacement without identity).  
**Schema constraint:** `UNIQUE (activity_id, voter_name)` on `votes` — vote = upsert (replaces emoji if same voter re-votes).

### D-03: /vote scope in Initiative 1
**Decision:** `/vote` shows ALL active activities. The "parent flags activities as considering this week" feature requires the `is_considering` column added in Initiative 2. In Initiative 1, vote across all activities.

### D-04: Rate limit number — 5 wrong attempts, 6th is 429
**Decision:** 5 incorrect PIN attempts within 60 seconds trigger the rate limiter. The 5th attempt still returns the normal error. The 6th attempt returns HTTP 429. This is consistent with the verification checklist ("6 rapid PIN attempts → 6th returns 429").

### D-05: Emoji vote buttons — explicit permitted exception
**Decision:** Vote buttons use 👍 😐 😴 emoji. This is a documented exception to the "no emojis as structural icons" rule. Rationale: these emojis ARE the content — they express emotional sentiment, which is exactly what emoji are designed for. The rule prohibits emoji replacing structural/navigation icons (back arrow, menu, close). Sentiment vote buttons are a legitimate use. Each `<button>` must have `aria-label`: "Love it", "Maybe", "Not for me".

### D-06: Passport stamps — multiple visits allowed
**Decision:** Multiple stamps for the same activity are allowed. A family may visit Fountains Abbey three times in a summer — each is a separate stamp record. No unique constraint on `passport_stamps.activity_id`. "We visited this!" always creates a new stamp.

### D-07: photo_url — not in Initiative 1
**Decision:** `photo_url` exists in the schema but no upload UI is built in Initiative 1. Passport stamp detail shows activity name, date, and notes only. Deferred to Initiative 3.

### D-08: Column enums and filter matching logic
**Canonical column values:**

| Column | Allowed values |
|--------|----------------|
| `weather` | `'sunny'`, `'rainy-friendly'`, `'both'` |
| `setting` | `'indoor'`, `'outdoor'`, `'both'` |
| `cost_tier` | `'free'`, `'cheap'`, `'moderate'`, `'premium'` |
| `category` | `'museum'`, `'nature'`, `'adventure'`, `'farm'`, `'water'`, `'heritage'`, `'sport'`, `'rainy-day'` |

**Filter chip matching:**
- ☀️ Sunny → `weather IN ('sunny', 'both')`
- 🌧 Rainy → `weather IN ('rainy-friendly', 'both')`
- 🏠 Indoor → `setting IN ('indoor', 'both')`
- 🌳 Outdoor → `setting IN ('outdoor', 'both')`
- 🆓 Free → `cost_tier = 'free'`
- 💚 Cheap → `cost_tier = 'cheap'`
- 🟡 Moderate → `cost_tier = 'moderate'`
- 💎 Premium → `cost_tier = 'premium'`

**Multi-chip logic:** AND across different dimensions, OR within the same dimension.  
Example: Sunny + Indoor → `(weather IN ('sunny','both')) AND (setting IN ('indoor','both'))`  
Example: Sunny + Rainy → `weather IN ('sunny','rainy-friendly','both')` (effectively all weather values)  
Example: Free + Cheap → `cost_tier IN ('free','cheap')` (OR within price dimension)  
Example: Free + Indoor + Rainy → `cost_tier='free' AND setting IN ('indoor','both') AND weather IN ('rainy-friendly','both')` (AND across all three dimensions)

---

## Schema Changes for Initiative 1

These are additions to the base schema defined in `business/project-plan.md`.

```sql
-- New table for server-side wishlist
CREATE TABLE wishlist_items (
  activity_id INTEGER PRIMARY KEY REFERENCES activities(id) ON DELETE CASCADE
);

-- Enforce vote replacement (upsert behaviour)
ALTER TABLE votes ADD CONSTRAINT votes_activity_voter_unique UNIQUE (activity_id, voter_name);
```

Drizzle schema definitions in `db/schema.ts` must reflect both of these.

---

## API Routes (Initiative 1)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/health` | none | |
| POST | `/api/auth/[...nextauth]` | — | next-auth handlers |
| GET | `/api/activities` | pin | Query params: `weather`, `setting`, `costTier` (all multi-value) |
| GET | `/api/activities/:id` | pin | |
| GET | `/api/activities/:id/calendar.ics` | pin | Query: `date=YYYY-MM-DD` (required), `time=HH:MM` (optional); Zod ISO 8601 validation |
| GET | `/api/votes` | pin | Query: `activityId` (optional; omit to return all) |
| POST | `/api/votes` | pin | Body: `{ activityId, emoji, voterName }`; upserts on `(activity_id, voter_name)` |
| GET | `/api/passport` | pin | |
| POST | `/api/passport` | pin | Body: `{ activityId, visitedDate, notes? }` |
| GET | `/api/wishlist` | pin | Returns array of `activityId` |
| POST | `/api/wishlist` | pin | Body: `{ activityId }`; idempotent |
| DELETE | `/api/wishlist/:activityId` | pin | |
| GET | `/api/memberships` | pin | For cost badge display on cards and detail |

---

## User Stories

---

### Authentication

#### US-AUTH-1: Child PIN Entry

**Background:**
- Family PIN is set in the `settings` table (`family_pin_hash`, bcrypt ≥12 rounds)
- The PIN entry screen uses a numpad layout — not a native `<input type="password">`

---

**Scenario: Unauthenticated access is blocked**

Given the child opens any app URL without a valid next-auth session cookie  
When the request is processed by the Next.js middleware  
Then the child is redirected to `/pin`  
And routes `/`, `/[id]`, `/passport`, `/vote`, and all `/api/*` (pin-gated) are inaccessible without a session

---

**Scenario: Correct PIN grants access**

Given the child is on `/pin`  
And the screen shows a numpad grid (digits 0–9 in 3×3+1 layout)  
And each numpad button is ≥56×56px  
When the child enters the correct family PIN using the numpad  
Then the form submits (auto-submit on PIN length completion, or via an "Enter" button)  
Then a signed HttpOnly SameSite=Strict JWT session cookie is set by next-auth  
And the child is redirected to `/`

---

**Scenario: Incorrect PIN shows child-friendly error**

Given the child is on `/pin`  
When they submit an incorrect PIN  
Then the message "Oops! Try again" is shown (not technical language like "invalid credentials")  
And the PIN display clears  
And they remain on `/pin`  
And the attempt is counted against the rate limit for that IP address

---

**Scenario: Rate limit locks out after 5 wrong attempts**

Given 5 incorrect PIN attempts have been made from the same IP within 60 seconds  
When a 6th attempt is made  
Then the server returns HTTP 429  
And the PIN screen shows "Too many tries! Take a break and try again in a minute"  
And no bcrypt comparison is attempted on the 6th request (fail fast)

---

**Scenario: Session expiry prompts friendly re-entry**

Given the child has an active session that has since expired  
When they navigate to any PIN-gated page  
Then they are redirected to `/pin`  
And the PIN screen shows "Your session ended — enter your PIN to continue"  
And after successful PIN entry, they are returned to the URL they originally requested

---

### Browse & Discovery

#### US-BROWSE-1: Alphabetical Activity List

**Scenario: Browse screen loads all active activities**

Given the child is authenticated  
When they navigate to `/`  
Then all activities where `is_active = true` are returned sorted A–Z by `name`  
And at least 70 activities are displayed (seeded data)  
And the layout is a 2-column card grid (1-column on screens ≤375px)

---

**Scenario: Loading state**

Given the child navigates to `/`  
When activity data is in flight  
Then skeleton card placeholders are shown (same card dimensions; background `var(--color-muted)`)

---

**Scenario: Empty state (no active activities)**

Given no activities have `is_active = true`  
When the browse screen loads  
Then a Lucide `Frown` icon is shown with the text "No adventures to explore yet — check back soon!"  
And the filter bar is still rendered

---

#### US-BROWSE-2: Filter by Weather and Setting

**Scenario: Single filter chip — Sunny**

Given the child is on the browse screen  
When they tap the "☀️ Sunny" chip  
Then only activities where `weather IN ('sunny', 'both')` are shown  
And the Sunny chip is visually highlighted (filled background, `var(--color-primary)` border)  
And all other chips remain unselected

---

**Scenario: Cross-dimension multi-filter (AND logic)**

Given the child has activated "☀️ Sunny"  
When they also tap "🏠 Indoor"  
Then only activities where `weather IN ('sunny','both') AND setting IN ('indoor','both')` are shown  
And both Sunny and Indoor chips are highlighted

---

**Scenario: Same-dimension multi-filter (OR logic)**

Given the child has activated "☀️ Sunny"  
When they also tap "🌧 Rainy"  
Then activities where `weather IN ('sunny','rainy-friendly','both')` are shown  
And both chips are highlighted

---

**Scenario: Deactivating the last active chip**

Given exactly one chip is active  
When the child taps it  
Then all active activities are shown (no filter applied)  
And no chip is highlighted

---

**Scenario: Filtered list is empty**

Given active chips produce no matching activities  
When the filtered list is empty  
Then the empty state reads: "No adventures match these filters — try removing one!"  
And the active chips remain visible and tappable

---

#### US-BROWSE-2b: Filter by Cost Tier

**Scenario: Single price chip**

Given the child is on the browse screen  
When they tap "🆓 Free"  
Then only activities where `cost_tier = 'free'` are shown  
And the Free chip is visually highlighted  
And all other price chips remain unselected

---

**Scenario: Multiple price chips (OR logic within dimension)**

Given the child has activated "🆓 Free"  
When they also tap "💚 Cheap"  
Then activities where `cost_tier IN ('free','cheap')` are shown  
And both Free and Cheap chips are highlighted

---

**Scenario: Price combined with weather or setting (AND logic across dimensions)**

Given the child has activated "🆓 Free"  
When they also tap "🌧 Rainy"  
Then only activities where `cost_tier = 'free' AND weather IN ('rainy-friendly','both')` are shown

Given the child has activated "💎 Premium"  
When they also tap "🏠 Indoor"  
Then only activities where `cost_tier = 'premium' AND setting IN ('indoor','both')` are shown

---

**Scenario: Deactivate last active price chip**

Given exactly one price chip is active  
When the child taps it  
Then the price filter is cleared  
And the no-price-filter result set is restored

---

**Scenario: Filtered list is empty**

Given active price and/or other chips produce no matching activities  
When the filtered list is empty  
Then the empty state reads: "No adventures match these filters — try removing one!"  
And all active chips remain visible and tappable

---

#### US-BROWSE-3: Activity Cards and Cost Badges

**Scenario: Card contents**

Given an activity is shown on the browse screen  
Then the card displays:
  - OG image cropped 16:9 (or gradient placeholder — see below)
  - Activity `name` in Fredoka font
  - A cost badge (see badge table)
  - Weather indicator: Lucide `Sun` icon (for sunny/both) or Lucide `CloudRain` icon (for rainy-friendly/both)
  - Setting indicator: Lucide `Home` icon (indoor/both) or Lucide `Trees` icon (outdoor/both)
  - A Lucide `Heart` icon in the top-right corner of the card image area

---

**Badge colour specifications:**

| `cost_tier` | Membership covers it? | Badge text | Background | Text |
|-------------|----------------------|------------|------------|------|
| `free` | no | "FREE" | `var(--color-secondary)` #059669 | white |
| `free` | yes | "FREE w/ [name]" | `var(--color-secondary)` #059669 | white |
| `cheap` | — | "Cheap" (£0.01–£7.99 p/child) | `var(--color-primary)` #2563EB | white |
| `moderate` | — | "Moderate" (£8–£14.99 p/child) | `var(--color-accent)` #D97706 | white |
| `premium` | — | "Premium" (£15+ p/child) | `#DC2626` | white |

For "FREE w/ [name]": use the `memberships.name` from the family membership that covers this activity. If multiple memberships cover it, use the first alphabetically.

---

**Scenario: Gradient placeholder for missing image**

Given an activity has a null `image_url`  
When its card is rendered  
Then the image area shows `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`  
And a centred Lucide `MapPin` icon (24px, white) is overlaid on the gradient

---

#### US-BROWSE-4: Surprise Me

**Scenario: Surprise Me with no active filters**

Given no filter chips are active  
When the child presses "Surprise Me!"  
Then one activity is selected at random from all active activities  
And the detail screen for that activity opens  
And (unless `prefers-reduced-motion: reduce`) a 200ms ease-out scale animation plays before navigation

---

**Scenario: Surprise Me respects active filters**

Given filter chips are active  
When the child presses "Surprise Me!"  
Then only activities matching the active filters are eligible  
And the random selection is drawn from that filtered set

---

**Scenario: Surprise Me with empty filtered set**

Given active chips produce no matching activities  
When the child presses "Surprise Me!"  
Then no navigation occurs  
And a toast notification reads: "No adventures match these filters — try removing one!"

---

#### US-BROWSE-5: Wishlist Heart

**Scenario: Add to wishlist**

Given an activity's `activity_id` is not in `wishlist_items`  
When the child taps the Lucide `Heart` icon on the activity card  
Then `POST /api/wishlist { activityId }` is called  
And the Heart icon renders as solid fill (`var(--color-accent)` amber)  
And this state persists across sessions and devices (server-side)

---

**Scenario: Remove from wishlist**

Given the activity's `activity_id` is in `wishlist_items`  
When the child taps the filled Heart icon  
Then `DELETE /api/wishlist/:activityId` is called  
And the icon returns to outline state (unfilled)

---

**Scenario: Heart state on browse screen load**

Given the child loads the browse screen  
When activity cards render  
Then `GET /api/wishlist` is called once during page load  
And cards whose `activity_id` is in the response render with a filled Heart  
And all other cards render with an outline Heart

---

**Scenario: Optimistic update on heart toggle**

Given the child taps a Heart  
When the API call is in flight  
Then the Heart state updates immediately without waiting for the server response  
If the API call fails, the Heart reverts to its previous state  
And a toast notification reads: "Couldn't update wishlist — try again"

---

### Activity Detail

#### US-DETAIL-1: Activity Hero Image

**Scenario: OG image available**

Given an activity has a non-null `image_url`  
When the detail screen opens  
Then the image is shown as a full-width hero at 16:9 aspect ratio with `object-fit: cover`

---

**Scenario: No OG image**

Given an activity has a null `image_url`  
When the detail screen opens  
Then a full-width 16:9 gradient placeholder is shown: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`  
And a centred Lucide `MapPin` icon (32px, white) is overlaid on the gradient

---

#### US-DETAIL-2: Cost and Membership Display

**Scenario: Cost badge with no covering membership**

Given an activity has a `cost_tier` value  
And no family membership covers this activity via `activity_memberships`  
When the detail screen opens  
Then the cost badge renders with the colour specification from US-BROWSE-3

---

**Scenario: Activity covered by family membership**

Given a membership ID in `family_memberships` is linked to this activity via `activity_memberships`  
When the detail screen opens  
Then the cost badge shows "FREE w/ [membership name]" with green (`var(--color-secondary)`) background

---

**Scenario: Cost badge while memberships load**

Given the detail page has opened  
While `GET /api/memberships` is still in flight  
Then the cost badge renders based on `cost_tier` alone  
Once memberships resolve and a covering membership is found, the badge updates to "FREE w/ [name]"

---

#### US-DETAIL-3: Map

**Scenario: Map toggle — default collapsed state**

Given an activity has non-null `lat` and `lng`  
When the detail screen opens  
Then a "Show on map ▾" toggle button is visible  
And no Leaflet map is initialised (no tile requests made)

---

**Scenario: Map expands on toggle tap**

Given the "Show on map ▾" toggle is visible  
When the child taps it  
Then the map area expands (200ms ease-out height animation)  
And while Leaflet hydrates, a fixed-height placeholder with `var(--color-muted)` background and centred Lucide `MapPin` is shown  
And the Leaflet map loads (`dynamic(() => import('./activity-map'), { ssr: false })`)  
And a pin is placed at `lat`/`lng`

---

**Scenario: Zoom controls meet touch target minimum**

Given the Leaflet map is expanded  
Then zoom controls rendered by `leaflet-overrides.css` are ≥44×44px  
And control styling uses Sky Blue design tokens

---

**Scenario: OSM attribution always visible**

Given the Leaflet map is rendered  
Then the "© OpenStreetMap contributors" attribution is visible in the map UI at all times  
And it is not hidden by CSS or suppressed via `attribution=""` on the TileLayer

---

**Scenario: Marker popup**

Given the map is expanded with a pin  
When the child taps the pin  
Then a popup shows the activity name and a "Open in Google Maps" link  
And the link opens in a new tab with `rel="noopener noreferrer"`

---

**Scenario: Activity without coordinates**

Given an activity has null `lat` or `lng`  
When the detail screen opens  
Then no "Show on map" toggle is rendered

---

#### US-DETAIL-4: Voting

**Scenario: Voter name prompt (first-time voter)**

Given the child taps a vote button  
And `localStorage.getItem('days-out-voter-name')` is null or empty string  
Then a modal appears: "What's your name?" with a text input (max 30 chars) and a "Let's go!" button  
When the child submits a non-empty name  
Then `localStorage.setItem('days-out-voter-name', name)` is called  
And the vote proceeds

---

**Scenario: Cast a vote**

Given `localStorage` has a non-empty voter name  
When the child taps 👍 (aria-label "Love it"), 😐 (aria-label "Maybe"), or 😴 (aria-label "Not for me")  
Then `POST /api/votes { activityId, emoji, voterName }` is called  
And the tapped button shows an active/highlighted state  
And vote tallies for this activity update immediately

**Note:** Emoji vote buttons are a permitted exception to the "no emojis as structural icons" rule (see Decision D-05). Each `<button>` must include an `aria-label`.

---

**Scenario: Replace existing vote**

Given the child previously voted 👍 on this activity  
When they tap 😐 "Maybe"  
Then `POST /api/votes` is called with `emoji: '😐'`  
And the server upserts on the `(activity_id, voter_name)` unique constraint  
And the tally updates: 👍 count decrements, 😐 count increments

---

**Scenario: Previous vote shown on page load**

Given the child has a stored voter name  
And they previously voted on this activity  
When the detail page loads  
Then vote tallies are shown for each emoji  
And the button for their current vote is highlighted

---

#### US-DETAIL-5: Add to Calendar

**Scenario: Open calendar bottom sheet**

Given the child is on the activity detail screen  
When they tap "Add to Calendar"  
Then a bottom sheet slides up (200ms ease-out)  
Containing:
  - A date picker (past dates not selectable)
  - An optional time picker (defaults to all-day if not set)
  - "Google Calendar" button
  - "Apple Calendar" button
  - "Outlook" button

---

**Scenario: Google Calendar link**

Given the child has selected a date (and optionally a time)  
When they tap "Google Calendar"  
Then a new tab opens (`target="_blank" rel="noopener noreferrer"`)  
And the URL is a `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...` link  
And `text` is the activity name (URL-encoded)  
And `dates` is formatted as `YYYYMMDD` (or `YYYYMMDDTHHmmssZ` with time)  
And `details` contains `website_url` and `location_name` (URL-encoded)  
And `location` is `location_name` (URL-encoded)

---

**Scenario: Apple Calendar iCal download**

Given the child has selected a date  
When they tap "Apple Calendar"  
Then a request is made to `GET /api/activities/:id/calendar.ics?date=YYYY-MM-DD` (with `&time=HH:MM` appended if time was selected)  
And the server returns a `.ics` file with `Content-Disposition: attachment; filename="[activity-name].ics"`  
And the `.ics` contains: SUMMARY (activity name), DTSTART (date/time), DESCRIPTION (website URL + location_name), LOCATION (location_name)  
And DTSTART is an all-day date (`VALUE=DATE:YYYYMMDD`) if no time was selected

---

**Scenario: Outlook link**

Given the child has selected a date  
When they tap "Outlook"  
Then a new tab opens (`target="_blank" rel="noopener noreferrer"`)  
And the URL is an Outlook live deep-link with the event name, date, and body containing `website_url` and `location_name`

---

**Scenario: Calendar action attempted without a date**

Given no date has been selected  
When the child taps any calendar button  
Then the date picker is highlighted with an error border (`#DC2626`)  
And a message reads "Pick a date first"  
And no tab opens, no file downloads

---

#### US-DETAIL-6: Visit Website

**Scenario: Venue website link**

Given an activity has a non-null `website_url`  
When the child taps "Visit Website"  
Then `website_url` opens in a new tab with `target="_blank" rel="noopener noreferrer"`

---

**Scenario: No website URL**

Given an activity has a null `website_url`  
Then the "Visit Website" button is not rendered

---

#### US-DETAIL-7: Mark as Visited

**Scenario: Add a passport stamp from activity detail**

Given the child is on an activity detail screen  
When they tap "We visited this!"  
Then a modal opens with:
  - Activity name (read-only)
  - Visited date (pre-populated with today's date, editable via date picker)
  - Optional notes text field (max 200 characters, plain text)
  - "Stamp Passport!" confirm button

When the child taps "Stamp Passport!"  
Then `POST /api/passport { activityId, visitedDate, notes }` is called  
And a toast notification reads: "Adventure stamped!"  
And the stamp appears in `/passport`

**Note:** `photo_url` is not in scope (see D-07). Multiple stamps for the same activity are allowed (see D-06).

---

### Adventure Passport

#### US-PASS-1: Stamp Collection Grid

**Scenario: Stamps visible**

Given the child navigates to `/passport`  
When the page loads  
Then all records in `passport_stamps` are shown as stamp cards in a grid (2 columns)  
And each stamp card shows: activity OG image (or gradient placeholder), activity name, visited date formatted as "04 Aug 2026"

---

**Scenario: Loading state**

Given the child navigates to `/passport`  
While stamps are fetching  
Then skeleton stamp placeholders are shown

---

**Scenario: Empty state**

Given no records exist in `passport_stamps`  
When the passport page loads  
Then a Lucide `Stamp` icon is shown with the text "No stamps yet — go on an adventure!"

---

#### US-PASS-2: Progress Bar

**Scenario: Progress indicator**

Given the child is on the passport page  
When the page loads  
Then a progress bar shows "X of Y adventures visited"  
Where X = `COUNT(DISTINCT activity_id)` from `passport_stamps`  
And Y = `COUNT(*)` from `activities WHERE is_active = true`  
And the bar fill (`var(--color-secondary)`) is proportional to X/Y  
And the bar track is `var(--color-muted)`

---

#### US-PASS-3: Stamp Detail

**Scenario: Tap stamp to view detail**

Given a stamp card is visible in the passport grid  
When the child taps it  
Then an overlay opens showing:
  - Activity OG image (or gradient placeholder) at 16:9
  - Activity name in Fredoka font
  - "Visited: 04 Aug 2026" (formatted `visited_date`)
  - Notes text if non-null; nothing if null
  - A close button (Lucide `X`, ≥44px target)

**Note:** Photo is not shown (photo_url deferred to Initiative 3).

---

### Family Vote

#### US-VOTE-1: Vote Page

**Scope note:** In Initiative 1, `/vote` shows ALL active activities. The `is_considering` filtering is added in Initiative 2.

**Scenario: Vote page loads**

Given the child navigates to `/vote`  
When the page loads  
Then all activities where `is_active = true` are listed  
And each activity shows:
  - Activity name
  - Three vote buttons: 👍 (aria-label "Love it") | 😐 (aria-label "Maybe") | 😴 (aria-label "Not for me")
  - Current tally for each emoji (e.g. "3 · 1 · 0")

---

**Scenario: Loading state**

Given the child navigates to `/vote`  
While data is fetching  
Then skeleton activity rows are shown

---

**Scenario: Empty state**

Given no active activities exist  
Then the page shows: "No adventures to vote on yet!"

---

#### US-VOTE-2: Casting a Vote from the Vote Page

**Scenario: Vote with name already stored**

Given the child is on `/vote`  
And `localStorage` has a non-empty voter name  
When they tap an emoji on any activity  
Then `POST /api/votes { activityId, emoji, voterName }` is called  
And the tally for that activity updates immediately (optimistic update)  
And the tapped button shows an active state

---

**Scenario: Voter name prompt on vote page**

Given the child has no voter name in `localStorage`  
When they tap any vote emoji on `/vote`  
Then the voter name modal from US-DETAIL-4 appears  
And after name entry, the vote proceeds  
And subsequent votes on this page (and any other page) do not re-prompt

---

### Observability

#### US-OPS-1: Health Endpoint

**Scenario: Healthy system**

Given the app container and database are running  
When `GET /api/health` is called  
Then the response is `{ "status": "ok", "db": "ok" }` with HTTP 200

---

**Scenario: Database unreachable**

Given the database container is stopped or unreachable  
When `GET /api/health` is called  
Then the response is `{ "status": "ok", "db": "error" }` with HTTP 200  
And the error is logged at `error` level via pino with no PII in the log payload  
And the health endpoint itself does not crash or return 5xx

---

## End-to-End Verification Checklist

1. `GET /api/health` → `{ "status": "ok", "db": "ok" }`
2. Open `http://192.168.1.25:3000` → redirects to `/pin`
3. Navigate to `/` without a session → redirects to `/pin`
4. Enter wrong PIN 5 times → friendly error shown; 6th attempt → 429 + lockout message
5. Enter correct PIN → redirected to `/`, browse screen loads
6. ≥70 activity cards shown, sorted A–Z, 2-column grid
7. Tap "☀️ Sunny" → filtered list; chip highlighted
8. Tap "🏠 Indoor" while Sunny active → AND filter; both chips highlighted
9. Deactivate one chip → filter updates; deactivate all → full list restored
9a. Tap "🆓 Free" → only free activities; chip highlighted
9b. Tap "💚 Cheap" while Free active → both tiers shown (OR logic within price)
9c. Tap "🆓 Free" + "🌧 Rainy" → free AND rainy-friendly activities (AND cross-dimension)
9d. Tap "💎 Premium" + "🏠 Indoor" → premium AND indoor activities (AND cross-dimension)
9e. Tap "🆓 Free" + "☀️ Sunny" + "🏠 Indoor" → all three dimensions AND'd correctly
10. Tap "Surprise Me!" → random activity detail opens; works within filtered set
11. Tap Heart on card → fills amber; hard refresh → still filled; tap again → unfilled
12. Tap any activity card → detail: OG image/gradient placeholder, cost badge, tags
13. Cost badge "FREE w/ NT" shown for NT-covered activities; "Cheap" badge blue for cheap activities
14. Tap "Show on map ▾" → expands; OSM tiles load; attribution visible; zoom controls ≥44px
15. Tap map pin → popup: activity name + Google Maps link (opens new tab)
16. Activity without lat/lng → no map toggle
17. Vote 👍 on activity → tally shows 1; vote 😐 → tally: 👍 0, 😐 1 (upsert)
18. First vote → voter name prompt; subsequent votes → no prompt
19. Tap "Add to Calendar" → bottom sheet; no date → validation error; pick date → Google Calendar link opens; `.ics` downloads on Apple Calendar
20. Tap "We visited this!" → modal; confirm → toast; navigate to `/passport` → stamp appears
21. `/passport` → stamp grid; progress "1 of Y"; tap stamp → overlay with date and notes
22. `/vote` → all activities shown with emoji tallies and counts; vote updates immediately
23. Stop DB container → `GET /api/health` → `{ db: "error" }`, HTTP 200; app continues to serve
24. Let session expire → navigate to any page → `/pin` with "Your session ended" message; re-auth returns to original URL
