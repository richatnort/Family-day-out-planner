# ADR-004: Leaflet.js + OpenStreetMap for Maps

**Status:** Accepted
**Date:** 2026-05-03
**Approved by:** ADR Board — all 5 roles approved (UI Engineer and Product Owner approved with implementation requirements added below)

---

## Context

Need to show activity locations on a map in the activity detail view. There are 70+ venues across West/North Yorkshire. The map must work on children's touch devices, load quickly on a home LAN, and cost £0.

---

## Options Considered

### Option A: Google Maps JavaScript API (rejected)
- Requires a billing account (£200/month free credit — billing relationship still required)
- Violates COST-01 risk: a misconfigured quota could incur unexpected charges
- Requires API key management

### Option B: Mapbox (rejected)
- Free tier limited to 50,000 tile requests/month — adequate for now, but a cliff edge to monitor
- Requires Mapbox account and API key — external dependency
- Commercial licence restrictions for some use cases

### Option C: Leaflet.js + OpenStreetMap via `react-leaflet` (chosen)
- 100% free, no API key required, no billing relationship
- Fully OSS — complies with COST-01, OSS-01, INFRA-01
- Sufficient for pinning 70 locations (no routing or complex queries needed)
- Tile caching in Initiative 4 (PWA/offline) is compatible with Leaflet
- `react-leaflet` wrapper is stable and well-maintained for Next.js

### Option D: MapLibre GL JS (rejected)
- More capable (vector tiles, routing)
- Overkill for simple static location pins
- Larger bundle size, more implementation complexity

---

## Decision

**Leaflet.js + OpenStreetMap tiles via `react-leaflet`.**

---

## Implementation Requirements

1. **SSR:** Leaflet accesses `window` and `document` directly. In Next.js App Router, the map component must be wrapped with `dynamic(() => import('./activity-map'), { ssr: false })`. This must wrap the entire component, not just the Leaflet import.

2. **Loading placeholder:** While Leaflet hydrates, show a fixed-height placeholder that matches the map container dimensions. Use a `--color-muted` background with a centred Lucide `MapPin` icon. Without a defined placeholder, the page has a layout shift when the map loads. This is particularly jarring on slower LAN devices.

3. **Leaflet CSS overrides (required deliverable):** Leaflet's default zoom controls use ~30px tap targets, which fail the 44px minimum for the children's interface. A `leaflet-overrides.css` file must override `.leaflet-control-zoom a` to reach ≥44px. Re-skin controls to Sky Blue design tokens.

4. **OSM attribution:** The `© OpenStreetMap contributors` attribution must remain visible in the map UI at all times. OpenStreetMap's tile usage policy requires it. The `react-leaflet` `AttributionControl` is enabled by default — do not suppress it via `attribution=""` or CSS that hides the attribution panel. This is a licence compliance requirement.

5. **Touch/pinch-zoom trap prevention for children:** A 4-year-old panning a map can get stuck and unable to scroll the page. Implement one of these patterns:
   - Wrap the map in a "Show map" expandable section (collapsed by default — children who don't need it skip it)
   - Or use a full-width map with a visible "tap to interact" overlay that must be dismissed before the map captures touch events
   
   The recommended pattern is a collapsed "Show on map ▾" toggle. This also reduces the Leaflet bundle impact for children who don't scroll to the map.

6. **Tile usage policy:** Add a descriptive `User-Agent` or `Referer` in any server-side tile proxying. For direct client-side tile fetches (the default Leaflet mode), the browser sends its own UA — no action needed. Do not implement automated tile pre-fetching against OSM's CDN; use a self-hosted tile cache (e.g. a service worker cache or an nginx tile proxy) when Initiative 4 adds offline support.

7. **Marker clustering:** With 70 venues, individual pins are manageable. If the dataset grows past ~200, `leaflet.markercluster` should be added. Design the `activity-map.tsx` component so clustering can be added without a full rewrite (i.e. don't hardcode marker creation outside of a map-layer abstraction).

---

## Caveats

- ~40KB gzipped for Leaflet + react-leaflet — acceptable with dynamic import (only loads when activity detail is viewed)
- Tile images are fetched from `tile.openstreetmap.org` at runtime — the map does not render fully offline. Tile caching for Initiative 4 must be handled separately

---

## Revisit If

- Need driving directions or routing — switch to MapLibre + OSRM (both OSS)
- Dataset grows to hundreds of venues — add marker clustering
