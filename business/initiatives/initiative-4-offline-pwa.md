# Initiative 4: Offline & PWA

**Status:** Pending — requires Initiative 1 stable  
**Dependencies:** Initiative 1 deployed and in active family use  
**Note:** User stories to be written before build, using the same 5-agent review process.

---

## Scope

Progressive Web App capabilities and offline support. Useful on days out when mobile data is unreliable in rural Yorkshire.

**Planned features:**
- Service worker caches the activity list and activity detail pages
- Map tile caching (aligned with ADR-004 tile usage policy — self-hosted tile cache, not direct OSM CDN pre-fetching)
- "Near me" mode using device GPS + haversine distance calculation
- Installable PWA (manifest, icons, splash screen)

---

## Constraints

- **ADR-004 compliance:** Tile caching must use a service worker cache or self-hosted nginx tile proxy — do not implement automated tile pre-fetching against `tile.openstreetmap.org`. Their CDN usage policy prohibits bulk pre-fetching.
- **OSS-01:** All PWA tooling must be OSS. Workbox (Google, Apache 2.0) is acceptable.
- **COST-01:** No paid push notification service. If push notifications are considered, use the Web Push API with a self-hosted VAPID key.
- **GPS / haversine:** Distance is calculated in-browser from `navigator.geolocation` + the activity's `lat`/`lng`. No server-side geolocation call. Store the family's home postcode in `settings` as the fallback origin when GPS is unavailable.

---

## Provisional Feature Notes

### Service Worker Cache Strategy

- Activity list (`/api/activities`): stale-while-revalidate with 24h max-age
- Activity detail (`/api/activities/:id`): cache-first, invalidated on update
- Static assets: cache-first
- Map tiles: cache-first via service worker, served from cache when offline. Tiles cached on first view, not pre-fetched.

### Near Me Mode

- User taps "Near me" on browse screen
- Browser requests `navigator.geolocation.getCurrentPosition()`
- Haversine distance calculated in-browser between device position and each `activity.lat`/`activity.lng`
- Activities sorted by distance ascending, with "~X miles" label on each card
- Fallback: if GPS unavailable, use home postcode (stored in settings) decoded to lat/lng

### PWA Manifest

- `name`: "Days Out"
- `short_name`: "Days Out"
- `theme_color`: `#2563EB` (primary)
- `background_color`: `#F8FAFC`
- Icons at 192px and 512px (Lucide `MapPin` styled in Sky Blue)

---

## User Stories

To be written before build begins, using the 5-agent review process (UX Engineer, Business Analyst, Principal React Engineer, Software Engineering Tester, Solution Architect). The stories must address:

- Service worker install and update flow
- Offline fallback page when activity detail is not cached
- Tile cache hit/miss behaviour (no broken tile display when offline)
- GPS permission prompt (child-friendly language)
- Distance display format
- PWA install prompt timing and dismissal
