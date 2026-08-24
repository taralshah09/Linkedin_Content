# Day 3 — 18 Aug 2026 — Google Maps: How does the app estimate your arrival time?

**main question:** How are routes, road conditions, historical patterns, and live traffic combined into an ETA?

**hld/excalidraw focus (from calendar):** Map data, GPS signals, traffic ingestion, route engine, ETA prediction service, tile/cache layer, and mobile client.

---

## 1. concept explanation

the question: how does google maps turn raw road data plus live traffic into that "12 min" eta you see the moment you type a destination?

how it actually works: when you request directions, your phone sends origin/destination to a routing service via an API gateway. the route engine pulls from a base map graph (roads as edges, intersections as nodes, each edge tagged with speed limits, lane counts, historical average speeds). it runs a shortest-path style algorithm (contraction hierarchies or similar) to generate a handful of candidate routes, not just one, biased by distance and typical speed.

separately, live traffic keeps streaming in continuously in the background: millions of phones running the maps app report anonymized gps pings, which get aggregated into current speed-per-road-segment. this pipeline is asynchronous and never stops, it's not triggered by any single user's request. those live signals get merged onto the same road graph, overriding or blending with historical averages for that segment.

the eta prediction service is where these come together: it takes the candidate route's edges, and for each edge picks live speed if fresh/confident data exists, else falls back to historical pattern for that time-of-day/day-of-week, else falls back to speed limit. sums up segment times, adds a scoring layer for things like signal density or event data, and returns the final number. the tile/cache layer exists so rendered map data and common route segments don't get recomputed from scratch for every nearby user making a similar request.

trade-offs worth knowing:
- freshness vs stability: live traffic data is noisy (a single slow car can look like congestion), so blending too aggressively makes the eta jump around, blending too conservatively makes it stale
- historical patterns are really a fallback for road segments with sparse live coverage (rural roads, off-peak hours), this is a coverage problem as much as an accuracy one
- precomputing routes/tiles vs computing live: caching speeds up common routes but makes the system slower to react to a sudden closure, which is why traffic ingestion runs as its own continuous async pipeline updating the graph, rather than being computed per request

---

## 2. gemini prompt

```
Build a basic high-level design skeleton for: "how does google maps estimate your arrival time" (combining routes, road conditions, historical patterns, and live traffic into a single ETA, one route request end to end).

Lay it out in five groups, left to right / top to bottom:
1. user surfaces (left): Mobile Client (Maps App)
2. API / edge layer (next): API Gateway
3. core services (center): Route Engine, ETA Prediction Service, Map Data Service
4. async / event-driven (below core services): GPS Signal Collector, Traffic Ingestion Pipeline, Historical Pattern Aggregator
5. data stores / external (right): Road Graph / Map Data Store, Live Traffic Store, Tile/Cache Layer

Give me:
1. the component list grouped exactly as above
2. the primary synchronous flow as numbered arrows, e.g. "1. Mobile Client -> API Gateway -> Route Engine" etc, all the way through to the ETA being returned to the user
3. the async flow as a SEPARATE numbered sequence (millions of phones streaming GPS pings, traffic ingestion aggregating those into live speed-per-segment, historical pattern aggregation running on a schedule, both feeding into the Road Graph / Map Data Store), explicitly marked "async - different color in the diagram"
4. one line per component: what shape to draw it as in Excalidraw and a short label (e.g. "rectangle: Route Engine - generates candidate routes from the road graph" / "cylinder: Live Traffic Store - current speed per road segment")
5. a one-line note on what NOT to draw as a core box: auth, logging, analytics, user accounts — these go in as small supporting blocks off to the side only

Keep it to ONE route request's journey, not the whole Google Maps platform.
```

---

## 3. linkedin post

```
how does google maps know your eta is 12 minutes before you've even left

it's not one calculation, it's three data sources getting merged in real time

first theres the base map graph. roads as edges, intersections as nodes, each edge tagged with speed limit and historical average speed for that time of day

then theres live traffic. every phone running maps is quietly sending anonymized gps pings back, this never stops, its running in the background 24/7 regardless of whether youre navigating right now. those pings get aggregated into current speed per road segment

the eta service takes your route and walks it segment by segment. got fresh live data for this stretch of road, use it. no live data (rural road, 3am), fall back to the historical pattern for that hour. no historical data either, fall back to the speed limit

what feels like one instant number is actually a fallback chain running per segment, then summed up

the tricky part isnt the math, its trust. one slow car can look like congestion in the live data. blend it in too fast and your eta jumps around every few seconds. blend it in too slow and it's stale by the time you hit the traffic jam


```

---

## 4. twitter / x post

```
your google maps eta isnt one calculation

its your route walked segment by segment, each one asking: got live traffic data? use it. no live data? fall back to historical pattern for this hour. no historical either? fall back to speed limit

sum it up, thats your eta

hld attached
```
