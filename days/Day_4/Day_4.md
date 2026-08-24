# Day 4 — 19 Aug 2026 — Swiggy/Zomato: How does food delivery tracking work?

**main question:** How does the app coordinate restaurant status, rider location, customer updates, and exceptions?

**hld/excalidraw focus (from calendar):** Order state machine, restaurant service, courier location stream, dispatch service, notification service, and tracking read model.

---

## 1. concept explanation

the question: how does the app keep your order status, the restaurant's kitchen status, and your rider's live location all in sync on one tracking screen?

how it actually works: the moment you place an order, an order service creates a record and puts it through a state machine, something like placed, accepted, preparing, ready for pickup, picked up, out for delivery, delivered. each state transition is triggered by a different party, the restaurant service pushes "accepted" and "preparing" from a tablet or pos integration, the dispatch service pushes "picked up" once a courier confirms, and so on. every transition gets written to the order state machine, which is the single source of truth for "what stage is this order at."

separately, couriers are streaming their gps location continuously, this is its own async pipeline, not tied to any one order's request cycle. the dispatch service uses this stream to assign a courier to an order in the first place, similar to how ride matching works, ranking nearby available riders and offering the order to one at a time.

the tracking screen you see isn't reading the state machine or the location stream directly, it reads from a tracking read model, a denormalized view built specifically to answer "where's my order right now" fast, combining current order state plus latest courier location plus eta in one place. this read model gets updated every time either the state machine changes or a new courier location ping comes in. the notification service watches the same events and fires push notifications at key transitions (order accepted, rider is nearby) without you needing to have the app open.

trade-offs worth knowing:
- write model (order state machine) vs read model (tracking view) are deliberately separated, this is basically CQRS, because what changes an order's state (restaurant, rider, system timeouts) is a very different shape of data from what a customer needs to see on one screen
- exceptions (restaurant rejects, rider cancels, address issue) have to be modeled as explicit state transitions, not just errors, because the customer-facing tracking screen still needs a coherent status to show
- courier location updates arrive far more frequently than order state changes, so the tracking read model has to handle two very different update rates without one starving the other

---

## 2. gemini prompt

```
Build a basic high-level design skeleton for: "how does swiggy/zomato style food delivery tracking work" (coordinating restaurant status, rider location, customer updates, and exceptions for one order end to end).

Lay it out in five groups, left to right / top to bottom:
1. user surfaces (left): Customer App, Restaurant App, Courier App
2. API / edge layer (next): API Gateway
3. core services (center): Order Service / Order State Machine, Dispatch Service, Restaurant Service
4. async / event-driven (below core services): Courier Location Stream, Notification Service, Tracking Read Model Updater
5. data stores / external (right): Order State DB, Courier Location Store, Tracking Read Model Store

Give me:
1. the component list grouped exactly as above
2. the primary synchronous flow as numbered arrows, e.g. "1. Customer App -> API Gateway -> Order Service" etc, covering order placement through to a courier being assigned and picking up the order
3. the async flow as a SEPARATE numbered sequence (courier gps pings streaming continuously into the location store, order state changes and location updates both feeding the Tracking Read Model Updater, the Notification Service watching for key transitions and pushing alerts), explicitly marked "async - different color in the diagram"
4. one line per component: what shape to draw it as in Excalidraw and a short label (e.g. "rectangle: Order Service - owns the order state machine" / "cylinder: Tracking Read Model Store - denormalized view for the live tracking screen")
5. a one-line note on what NOT to draw as a core box: auth, payments, ratings/reviews, analytics — these go in as small supporting blocks off to the side only

Keep it to ONE order's journey, not the whole Swiggy/Zomato platform.
```

---

## 3. linkedin post

```
your swiggy tracking screen isnt reading one source of truth, its reading a completely different system from the one that actually manages your order

on one side theres the order state machine. placed, accepted, preparing, picked up, delivered. every transition gets triggered by a different party, the restaurant pushes "preparing", the courier app pushes "picked up", the system itself can push exceptions like a rejection or a cancellation

on a totally separate track, couriers are streaming their gps location constantly, this has nothing to do with any single order, its just always running in the background across every active rider

the tracking screen you stare at while waiting for your biryani is reading neither of these directly. its reading a "tracking read model", a view built just to answer one question fast: wheres my order right now. it gets updated every time the state machine changes OR a new location ping comes in, whichever happens first

this split exists because the two updates happen at wildly different speeds, order state might change 5 times over 30 minutes, courier location changes every few seconds. cramming both into one system would make the whole thing slower and messier

exceptions are the underrated part. a rejected order or a cancelled rider isnt just an error, its a real state the tracking screen has to represent clearly, or the app just looks broken to you

mapped the full flow into an hld, attached below
```

---

## 4. twitter / x post

```
your swiggy tracking screen doesnt read the order system directly

theres an order state machine (placed, preparing, picked up) and a separate courier gps stream running nonstop

both feed into one "tracking read model" built just to answer wheres my order, fast

hld attached
```
