# Initiative 2: Admin Panel

**Status:** Pending — requires Initiative 1 live  
**Dependencies:** Initiative 1 deployed, all verification checks passed  
**User story review:** 5-agent review (same process as Initiative 1) required before build begins

---

## Scope

Parent-facing admin area accessible via `/admin`. Separate password authentication from the family PIN.

**In scope:**
- Admin login (`/login`) with password auth
- Activity CRUD (create, read, update, delete)
- `is_considering` flag — mark activities for the Family Vote shortlist
- `is_plan` flag — confirm activities for This Week's Plan
- Mystery mode — hide activity name on the plan page
- Membership management with expiry dates and alerts
- Admin dashboard (counts, vote summary, expiry alerts)
- This Week's Plan view for children (`/plan` — PIN-gated)

**Out of scope:**
- URL import via Groq (Initiative 3)
- Activity image upload (images auto-fetched from website_url via open-graph-scraper on save)

---

## Schema Changes for Initiative 2

```sql
ALTER TABLE activities
  ADD COLUMN is_considering BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_plan        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_mystery     BOOLEAN NOT NULL DEFAULT false;
```

---

## API Routes (additions for Initiative 2)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/activities` | admin | Create activity |
| PUT | `/api/activities/:id` | admin | Update activity |
| DELETE | `/api/activities/:id` | admin | Delete activity (soft-delete: set is_active = false) |
| POST | `/api/memberships` | admin | Add membership |
| PUT | `/api/memberships/:id` | admin | Update membership |
| DELETE | `/api/memberships/:id` | admin | Remove membership |

Also update `/api/votes` (GET) to add `?week=true` filter returning only activities where `is_considering = true`.

---

## User Stories

### Authentication

#### US-ADMIN-AUTH-1: Admin Login

**Scenario: Correct password grants admin access**

Given a parent visits `/login`  
When they submit the correct admin password  
Then a signed HttpOnly SameSite=Strict JWT admin session cookie is set  
And they are redirected to `/admin`

**Scenario: Wrong password shows error**

Given a parent submits an incorrect password  
Then an error message is shown ("Incorrect password")  
And they remain on `/login`

**Scenario: Rate limit on admin login**

Given 5 incorrect admin login attempts from the same IP within 60 seconds  
When a 6th attempt is made  
Then the server returns HTTP 429  
And the page shows "Too many attempts — try again in a minute"

---

### Activity Management

#### US-ADMIN-ACT-1: View All Activities

**Scenario: Activity list**

Given the admin is on `/admin/activities`  
When the page loads  
Then all activities (active and inactive) are listed alphabetically by name  
And each row shows: name, category, cost tier, is_active status, is_considering flag

---

#### US-ADMIN-ACT-2: Create Activity (manual form)

**Scenario: Create a new activity**

Given the admin fills in the activity form with all required fields  
When they save  
Then the activity is created with `is_active = true`  
And `open-graph-scraper` fetches the OG image from `website_url` and stores it as `image_url`  
And the activity appears immediately in the children's browse screen

**Required fields:** name, category, cost_tier, weather, setting, website_url, lat, lng, location_name  
**Optional fields:** description, food, age_min, age_max, prebooking_required, image_url override

---

#### US-ADMIN-ACT-3: Edit Activity

**Scenario: Edit existing activity**

Given the admin selects an activity and modifies fields  
When they save  
Then the activity updates immediately in all views  
And if `website_url` changed, the OG image is re-fetched

---

#### US-ADMIN-ACT-4: Deactivate Activity

**Scenario: Deactivate (soft delete)**

Given the admin selects an activity  
When they tap "Deactivate"  
Then a confirmation prompt appears: "Remove [name] from browse?"  
When confirmed  
Then `is_active` is set to `false`  
And the activity no longer appears in children's views  
And it remains in the admin list (can be reactivated)

---

#### US-ADMIN-ACT-5: Flag for Family Vote

**Scenario: Toggle 'considering this week'**

Given the admin is viewing an activity  
When they toggle "Considering this week"  
Then `is_considering` flips to `true`  
And the activity appears on the children's `/vote` page (filtered view)  
And the activity appears in the admin vote summary dashboard

When toggled off  
Then `is_considering` flips to `false`  
And the activity disappears from the filtered vote view

---

#### US-ADMIN-ACT-6: Confirm for This Week's Plan

**Scenario: Add to plan**

Given the admin confirms an activity for this week  
When they toggle "In this week's plan"  
Then `is_plan` is set to `true`  
And the activity appears on children's `/plan` page

**Scenario: Mystery activity**

Given the admin checks "Mystery destination" on a plan activity  
Then `is_mystery = true`  
And on the children's `/plan` page, the activity shows a lock icon and "Mystery Adventure!" instead of its name  
And the OG image is also hidden

---

### Membership Management

#### US-ADMIN-MEM-1: Add Membership

**Scenario: Add new family membership**

Given the admin visits `/admin/memberships`  
When they add a membership with name, description, and optional expiry date  
And they link it to one or more activities  
Then it appears in the membership list  
And linked activities show the "FREE w/ [name]" cost badge in children's views

---

#### US-ADMIN-MEM-2: Expiry Status Indicators

**Scenario: Active membership**

Given a membership has no expiry date, or expiry is more than 30 days away  
When shown in the membership list  
Then a green dot is displayed

**Scenario: Expiring soon**

Given a membership expires within 30 days  
When shown in the membership list  
Then an amber dot is displayed  
And it sorts to the top of the list

**Scenario: Expired**

Given a membership has an expiry date in the past  
When shown in the membership list  
Then a red dot is displayed

---

#### US-ADMIN-MEM-3: Expiry Badge on Activities

**Scenario: Expiring-soon badge**

Given a membership covering an activity expires within 30 days  
When that activity is shown in any view (admin or children's)  
Then a small badge reads "[Membership name] expires [DD MMM YYYY]"

---

### Admin Dashboard

#### US-ADMIN-DASH-1: Overview

**Scenario: Dashboard on load**

Given the admin visits `/admin`  
When the page loads  
Then they see:
  - Activity count by category (bar chart or count table)
  - This week's vote summary: top-voted activities among `is_considering = true` activities
  - Membership expiry alerts: any memberships expiring within 30 days

---

### Children's Plan View

#### US-PLAN-1: This Week's Plan

**Scenario: Confirmed activities visible**

Given one or more activities have `is_plan = true`  
When the child visits `/plan`  
Then those activities are listed in the plan  
And each has an "Add to Calendar" button (same behaviour as US-DETAIL-5)

**Scenario: Mystery activity hidden**

Given an activity has `is_mystery = true` and `is_plan = true`  
When shown on the plan page  
Then the activity shows a lock icon and "Mystery Adventure!" instead of the name  
And the OG image is not shown

**Scenario: Empty plan**

Given no activities have `is_plan = true`  
When the child visits `/plan`  
Then the page shows: "Nothing confirmed yet — check back soon!"

---

## Updated /vote Page (Initiative 2)

Once Initiative 2 is live, the `/vote` page changes from "all activities" to "activities where `is_considering = true`". The user story US-VOTE-1 from Initiative 1 is superseded by this:

**Scenario: Shortlisted activities only**

Given the admin has flagged some activities as "Considering this week"  
When a child visits `/vote`  
Then only activities where `is_considering = true` are shown  
And the page header reads "Vote for this week's adventures!"

Given no activities are flagged  
When a child visits `/vote`  
Then the page shows: "Nothing shortlisted yet — check back soon!"
