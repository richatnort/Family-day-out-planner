# Initiative 3: Groq AI

**Status:** Pending — requires Initiative 2 live  
**Dependencies:** Initiative 2 admin panel deployed  
**Note:** User story review (5-agent process) required before build begins. This initiative needs further exploration — the URL import use case is defined below, but other potential Groq applications should be explored during review.

---

## Scope

AI-powered features using Groq `llama-3.3-70b-versatile`. Groq is never on the critical path — all features must degrade gracefully to a manual fallback.

**Defined features:**
- URL Import: paste a venue website URL → Groq extracts activity details → form pre-fills

**Potential additional features (to explore during user story review):**
- Activity description enhancement: admin pastes rough notes → Groq writes a child-friendly description
- Seasonal suggestions: Groq suggests activities from the database based on weather or time of year
- Vote analysis: Groq summarises family voting patterns in natural language ("Your family loves outdoor adventures")

**Groq API key:** Added to `.env.example` when this initiative begins.

---

## Constraints

- **COST-01:** Groq free tier — 14,400 requests/day. Family usage is ~5–10/day. Never implement polling or automated batch calls.
- **SSRF protection:** All URL fetching goes through `lib/ssrf-guard.ts` before fetching. Same pattern as shopping-list `urlValidation.ts`.
- **Graceful failure:** If Groq is unavailable, the admin sees the manual form with a toast. No errors surface to children.

---

## Groq Extraction Prompt (URL Import)

The extraction prompt sends scraped page content to Groq and requests structured JSON:

```
You are extracting information about a visitor attraction in Yorkshire, UK.
Given the following website content, extract the activity details.

Return ONLY valid JSON matching this schema — no markdown, no explanation:
{
  "name": string,
  "description": string (max 200 chars, written for children aged 4-12, enthusiastic tone),
  "category": one of: "museum" | "nature" | "adventure" | "farm" | "water" | "heritage" | "sport" | "rainy-day",
  "cost_tier": one of: "free" | "cheap" | "moderate" | "premium",
  "weather": one of: "sunny" | "rainy-friendly" | "both",
  "setting": one of: "indoor" | "outdoor" | "both",
  "food": one of: "on-site" | "nearby" | "none" | "unknown",
  "prebooking_required": boolean,
  "website_url": string
}

Cost tier thresholds (per child entry price):
- free: £0
- cheap: £0.01–£7.99
- moderate: £8.00–£14.99
- premium: £15.00+

If you cannot determine a value, use null for optional fields or your best guess for required fields.
If the content is not about a visitor attraction, return { "error": "not an attraction" }.

Website content:
{SCRAPED_CONTENT}
```

---

## API Routes (additions for Initiative 3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/activities/import` | admin | URL → page scrape → Groq extraction → JSON |

---

## User Stories

### URL Import

#### US-GROQ-1: URL Extraction

**Scenario: Successful extraction**

Given the admin is adding a new activity  
And they select the "Import from URL" tab  
When they paste a venue website URL and tap "Extract details"  
Then `POST /api/activities/import { url }` is called  
And the backend validates the URL via `lib/ssrf-guard.ts` (blocks private IPs, non-HTTP schemes)  
And the backend fetches the page content  
And sends the content to Groq `llama-3.3-70b-versatile` with the extraction prompt  
Then the form fields pre-fill with the extracted values:
  - name, description, category, cost_tier, weather, setting, food, prebooking_required, website_url
And all pre-filled fields remain editable before saving  
And the admin reviews and confirms before the activity is created

---

**Scenario: Pre-filled cost tier uses hardcoded thresholds**

Given Groq has extracted a cost tier  
When the form pre-fills  
Then the cost_tier value reflects the hardcoded thresholds:
  - Free = £0, Cheap = £0.01–£7.99, Moderate = £8–£14.99, Premium = £15+  
And the admin can override the value before saving

---

#### US-GROQ-2: Graceful Failure — Groq Unavailable

**Scenario: Groq API returns error or times out**

Given the admin submits a URL for extraction  
When Groq is unavailable, rate-limited, or returns an error  
Then the server returns a structured error response  
And the admin sees a toast: "Auto-fill unavailable — please fill in manually"  
And the manual entry form is shown with all fields empty (not partially filled)  
And no error is shown to children (this feature is admin-only)

---

#### US-GROQ-3: Graceful Failure — Non-Attraction URL

**Scenario: URL is not a venue website**

Given the admin pastes a URL that is not a visitor attraction (e.g. a news article)  
When Groq returns `{ "error": "not an attraction" }`  
Then the admin sees: "That page doesn't look like a venue — try a different URL or fill in manually"  
And the manual form is shown

---

#### US-GROQ-4: SSRF Protection

**Scenario: URL points to internal network**

Given the admin pastes a URL like `http://192.168.1.1/` or `http://localhost:3000/`  
When the backend processes it  
Then `lib/ssrf-guard.ts` blocks the request before any HTTP fetch is made  
And the admin sees: "That URL isn't allowed"  
And no internal request is made

**Blocked patterns:**
- Private IP ranges: 10.x.x.x, 172.16–31.x.x, 192.168.x.x
- Loopback: 127.x.x.x, ::1
- Link-local: 169.254.x.x
- Non-HTTP/HTTPS schemes (file://, ftp://, etc.)

---

#### US-GROQ-5: URL Extraction Loading State

**Scenario: In-progress extraction**

Given the admin has submitted a URL  
While the backend is fetching and calling Groq  
Then the "Extract details" button shows a loading spinner  
And the button is disabled (no duplicate requests)  
And a message reads "Fetching details…"  
Until the response arrives (success or failure)
