# Day 5 — 20 Aug 2026 — Blinkit/Zepto: How does a 10-minute delivery promise work?

**main question:** How are inventory, dark stores, picking, batching, and dispatch coordinated?

**hld/excalidraw focus (from calendar):** Catalog, inventory reservation, nearest-dark-store selection, picker workflow, courier assignment, order orchestration, and ETA service.

---

## 1. concept explanation

the question: how does an app promise your groceries in 10 minutes and actually pull it off, most of the time?

how it actually works: the trick isn't delivery speed, it's that almost everything before "courier picks up the bag" is pre-solved. when you open the app, it doesn't show you every product in the city, it shows you the catalog of the one dark store nearest your pin, because that's the only inventory that can reach you in 10 minutes. as you add items to cart, the system does a soft inventory reservation against that specific store's stock, so the item you're looking at doesn't get sold out from under you by someone else browsing the same store. once you place the order, an order orchestrator kicks off a workflow: it assigns the order to a picker inside that dark store, who gets a pick-list on a handheld device optimized for shortest walking path through the aisles, often bundled with other pending orders (batching) so one picker run serves 2-3 baskets at once. as picking finishes, the system assigns a courier who's already idling near that dark store, not one dispatched from far away. an ETA service is running the whole time in parallel, recalculating your delivery estimate based on picking progress, courier distance, and traffic, so the number on your screen keeps tightening as things actually happen.

trade-offs worth knowing:
- hyperlocal inventory (one store per user) vs city-wide inventory (more selection): the 10-minute promise only works because they gave up citywide catalog breadth for radius-limited stock
- batching orders improves picker efficiency but adds a small queuing delay per order, dark stores tune batch size against SLA risk
- inventory reservation has to be short-lived and aggressive, if reservations hang around too long on abandoned carts, real stock gets falsely blocked for other buyers

---

## 2. gemini prompt

```
Build a basic high-level design skeleton for: "how does a 10-minute grocery delivery promise work" (blinkit/zepto-style quick commerce, one order end to end).

Lay it out in five groups, left to right / top to bottom:
1. user surfaces (left): Customer App, Picker Handheld App, Courier App
2. API / edge layer (next): API Gateway
3. core services (center): Catalog Service, Nearest Dark Store Selector, Inventory Reservation Service, Order Orchestrator, Picker Workflow Service, Courier Assignment Service, ETA Service
4. async / event-driven (below core services): Order Status Event Bus, Batching Engine, Inventory Sync Stream (from dark store to catalog)
5. data stores / external (right): Dark Store Inventory DB, Order DB, Geospatial Store Index, Maps/Traffic API

Give me:
1. the component list grouped exactly as above
2. the primary synchronous flow as numbered arrows, e.g. "1. Customer App -> API Gateway -> Nearest Dark Store Selector" etc, all the way through to courier assigned and ETA shown
3. the async flow as a SEPARATE numbered sequence (batching orders for a picker run, live inventory sync back to catalog, ETA recalculation as picking/courier progress updates), explicitly marked "async - different color in the diagram"
4. one line per component: what shape to draw it as in Excalidraw and a short label (e.g. "rectangle: Inventory Reservation Service - holds stock for active carts")
5. a one-line note on what NOT to draw as a core box: auth, payments, analytics, promotions engine — these go in as small supporting blocks off to the side only

Keep it to ONE order's journey through ONE dark store, not the whole quick-commerce platform.
```

---

## 3. linkedin post

```
how does blinkit actually get groceries to your door in 10 minutes

it's not magic delivery speed. it's that the app already solved most of the problem before you even hit "order"

when you open the app it only shows you stock from the one dark store closest to your location. that's not a personalization feature, that's the entire trick, they never promise you inventory that can't physically reach you in time

the moment you add something to cart, that item gets reserved against that store's stock so it doesn't vanish while you're deciding between two brands of ketchup

once you order, a picker inside that dark store gets a pick list built for the shortest walk through the aisles, usually bundled with a couple other nearby orders so one trip covers multiple baskets

a courier who's already sitting near that store gets assigned, not one starting from across the city

and the eta on your screen isn't a static promise, it's recalculating in real time as picking finishes and the courier gets closer

the 10 minute number isn't a delivery speed flex. it's a radius constraint wearing a marketing costume

mapped the whole flow out as a proper hld, attached below
```

---

## 4. twitter / x post

```
blinkit's 10 min promise isnt about fast delivery

its about only ever showing you stock from the one dark store close enough to hit that number

everything after that, picking, batching, courier assignment, is just execution on a bet already won at the catalog step

hld attached
```
