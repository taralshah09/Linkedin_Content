# Day 8 — 23 Aug 2026 — Flipkart/Myntra: How does an e-commerce return work?

**main question:** How does a return request trigger eligibility checks, reverse logistics, inspection, refund, and inventory changes?

**hld/excalidraw focus (from calendar):** Order history, return policy engine, pickup scheduler, warehouse inspection, refund service, inventory update, and notifications.

---

## 1. concept explanation

the question: when you tap "return" on a delivered item, how does that one action fan out into eligibility checks, a reverse pickup, a warehouse inspection, your refund, and a stock adjustment?

how it actually works: you open order history and hit return on a delivered item, pick a reason (wrong size, damaged, changed mind). that request goes to a return policy engine that decides if you're even allowed to return it: are you inside the return window, is the item category returnable at all (innerwear, perishables usually aren't), does your stated reason qualify for a refund vs an exchange. if it fails here, you never see a pickup option. if it passes, a return request is created and handed to a pickup scheduler, which talks to reverse logistics, books a courier slot, and generates the return label. the item is picked up and travels back to a warehouse. crucially the refund usually doesn't fire yet. at the warehouse an inspection/QC step verifies the item matches the order, checks condition, tags, serial numbers. only once inspection passes does the refund service push money back to the original payment method (or wallet), and the inventory service updates stock in the same beat: resellable units go back into sellable inventory, damaged units get routed to writeoff/liquidation so they aren't sold again. every state change emits an event that fires a notification.

trade-offs worth knowing:
- refund timing: refund-on-pickup feels great to the customer but exposes you to fraud and loss; refund-after-inspection is safer but slower. this is a real business call, not a tech detail.
- a return is a long-running, async state machine (requested -> picked up -> inspected -> refunded) that spans days, not a synchronous request. it has to be event-driven with durable state, not a single blocking call.
- inventory reconciliation timing: you don't restock a unit until inspection confirms it's resellable, otherwise you oversell damaged goods and create a second bad experience.

---

## 2. gemini prompt

```
Build a basic high-level design skeleton for: "how does an e-commerce return work" (Flipkart/Myntra-style product return, one return request end to end, from tapping "return" through refund and restock).

Lay it out in five groups, left to right / top to bottom:
1. user surfaces (left): Customer App / Order History
2. API / edge layer (next): API Gateway
3. core services (center): Return Policy / Eligibility Engine, Return Orchestrator (long-running state machine), Pickup Scheduler, Warehouse Inspection / QC Service, Refund Service, Inventory Service
4. async / event-driven (below core services): Event Bus (return:requested, return:picked_up, return:inspected, return:refunded), Reverse Logistics / Courier integration, Notification Service
5. data stores / external (right): Order DB, Returns DB (return state), Inventory DB, Payment / Refund Gateway (external)

Give me:
1. the component list grouped exactly as above
2. the primary synchronous flow as numbered arrows, e.g. "1. Customer App -> API Gateway -> Return Policy Engine (eligibility check) -> Return Orchestrator -> Pickup Scheduler", all the way to a created, scheduled return request
3. the async flow as a SEPARATE numbered sequence, explicitly marked "async - different color in the diagram": item picked up by reverse logistics, arrives and is inspected, inspection result event drives the Refund Service and the Inventory Service, and every state change emits an event that the Notification Service consumes
4. one line per component: what shape to draw it as in Excalidraw and a short label (e.g. "rectangle: Return Policy Engine - checks return window, category, reason eligibility"; "cylinder: Returns DB - stores return state machine")
5. a one-line note on what NOT to draw as a core box: auth, logging, analytics, seller payouts - these go in as small supporting blocks off to the side only

Keep it to ONE return request's journey, not the whole Flipkart platform. Make it clear the refund fires AFTER warehouse inspection, and that inventory only restocks resellable units.
```

---

## 3. linkedin post

```
how does a return actually work when you tap "return" on flipkart or myntra

it feels like one button. its actually a multi day pipeline with a bunch of checkpoints

first a return policy engine checks if youre even eligible. are you inside the return window, is the item category returnable, does your reason qualify. if any of that fails you never even get the pickup option

if it passes, a return request gets created and handed to a pickup scheduler. that talks to reverse logistics, books a courier slot, generates the label. the item starts traveling back to the warehouse

heres the part most people dont think about. the refund usually doesnt fire yet. the item lands at the warehouse and goes through inspection. does it match what you ordered, is it damaged, are the tags intact

only after inspection clears does the refund service push money back to your original payment method. and inventory updates in the same beat, resellable stuff goes back into sellable stock, damaged stuff gets routed to writeoff so it doesnt get sold again

the whole thing is a long running state machine. requested, picked up, inspected, refunded. every state change is what fires those notification pings you get

the interesting tension is refund timing. refund on pickup feels amazing but opens you up to fraud. refund after inspection is safer but slower. thats a real business call not a tech detail

mapped the full flow as an hld, attached below
```

---

## 4. twitter / x post

```
hitting return on flipkart doesnt just refund you

it checks eligibility, books a reverse pickup, ships the item back, inspects it at the warehouse, then releases the refund and restocks or writes off the unit

one button, a whole state machine

hld attached
```
