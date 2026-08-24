---
name: hld-concept-explainer
description: Explains how a real-world product or system works (the "how does X work" concept behind a day's post) and generates a ready-to-paste Gemini prompt for producing a basic HLD, which the user then draws by hand in Excalidraw. Use whenever the user pastes a full row from their "How Does X Work" content calendar, or asks to explain a system-design concept for building an HLD. Triggers on phrases like "explain day X", "give me the HLD prep for this", "concept + gemini prompt for [topic]", or whenever a calendar row containing a topic, main question, and HLD/Excalidraw focus is provided. This skill runs alongside genz-hook-post-drafter whenever a full row is given — both outputs are produced in the same response.
---

# HLD Concept Explainer

Turns one calendar row into two things: a plain-language explanation Taral can actually understand, and a ready-to-paste Gemini prompt he'll use to get a basic HLD skeleton before redrawing it himself in Excalidraw.

This skill does NOT draw anything itself. It never renders a diagram, never uses the visualizer. It only produces text: an explanation and a prompt for Gemini.

## When input is incomplete

If the user gives only a bare topic name with no "main question" or "HLD focus" angle (e.g. just "Uber" with nothing else), do not guess which user journey to focus on. Ask one short question naming 2-3 plausible angles (e.g. "driver matching, ETA calc, or surge pricing?") before proceeding. If a full row is pasted (topic + main question + HLD focus, in whatever format), that's enough — proceed without asking.

## Output structure

Always produce exactly two labeled sections, in this order.

### 1. the concept, explained

Plain, clear, educational tone — this section is NOT written in the genz voice, it's for Taral's own understanding first. Structure:

- **the question**: restate the main question being answered, one line.
- **how it actually works**: a step-by-step plain-english walkthrough of the mechanism — trace one concrete journey (e.g. one ride request, one message, one video upload) through the system rather than describing the whole company. Follow the calendar's own guardrail: if the exact internals of a named company aren't public, frame it as "here's one way this could be designed at scale," not a claim about their actual stack.
- **trade-offs worth knowing**: 2-3 bullet points on the real architectural decisions/tensions in this system (e.g. consistency vs latency, push vs pull, sync vs async) — this is the part that actually makes the HLD interesting instead of a generic box diagram.

Target length: roughly 200-350 words. Tight enough to read in two minutes, detailed enough that the HLD makes sense afterward.

### 2. gemini prompt (copy-paste ready)

A single fenced code block, fully filled in with the specific topic's details (never a generic template left for the user to fill in themselves). The prompt instructs Gemini to output a **basic HLD skeleton in structured text**, not an image, following this visual grammar (from the calendar's own editorial direction):

- user surfaces on the **left**
- API / edge layer **next**
- core product services in the **center**
- asynchronous / event-driven components **below** the core services
- data stores and external providers on the **right**
- numbered arrows for the primary synchronous request flow
- a separately labeled group (a different "color" in the eventual diagram) for background events, notifications, analytics, or ML pipelines

The Gemini prompt itself should ask for:
1. A list of components grouped by layer (using the five groups above)
2. The primary request flow as a numbered sequence of arrows between components
3. The async/background flow as a separate numbered sequence, clearly marked as "async — different color"
4. One line per component on what shape/label to use when redrawing it in Excalidraw (e.g. "rectangle: Dispatch Service" / "cylinder: Geospatial Index")
5. A short "what NOT to include" note reminding it to keep this to one user journey, not the whole company — cross-cutting stuff like auth, observability, analytics goes in as small supporting blocks only, not core boxes

Keep the Gemini prompt itself write-once — Taral pastes it straight into Gemini with no edits needed.

## Worked example

Input row: Day 2, Uber — "How does a ride request find the right driver?" — Rider app, driver location stream, geospatial index, dispatch service, matching queue, timeout/fallback flow, ride service.

Output:

---

**1. the concept, explained**

the question: how does the app find, rank, notify, and lock in a driver within a few seconds of you tapping "request ride"?

how it actually works: when you request a ride, your app sends your pickup location to a dispatch service. that service queries a geospatial index (drivers are constantly streaming their live location into this index, usually via something like a geohash or H3 grid so "nearby" is a fast lookup, not a full table scan). the index returns a shortlist of nearby, available drivers. the dispatch service ranks that shortlist — distance, ETA, driver rating, sometimes acceptance-rate history — and pushes a ride offer to the top candidate, not everyone at once. that driver has a short window (10-15s) to accept. if they don't, the offer times out and rolls to the next ranked driver. once someone accepts, the ride service locks the match, updates ride state, and stops the offer chain.

trade-offs worth knowing:
- sequential offering (one driver at a time) vs broadcast offering (many at once) — sequential is fairer and avoids race conditions on who "gets" the ride, but is slower under low driver density
- the geospatial index has to trade update frequency against index rebuild cost — driver locations update every few seconds, so the index needs to handle high write throughput alongside read queries
- the timeout/fallback chain is really a retry queue in disguise — worth drawing as its own small loop, not folded into the main flow

**2. gemini prompt (copy-paste ready)**

```
Build a basic high-level design skeleton for: "how does a ride request find the right driver" (uber-style ride matching, one ride request end to end).

Lay it out in five groups, left to right / top to bottom:
1. user surfaces (left): Rider App, Driver App
2. API / edge layer (next): API Gateway
3. core services (center): Dispatch Service, Geospatial Index, Matching/Ranking logic, Ride Service
4. async / event-driven (below core services): Driver Location Stream, Offer Timeout Queue, Notification Service
5. data stores / external (right): Driver Location Store, Ride State DB

Give me:
1. the component list grouped exactly as above
2. the primary synchronous flow as numbered arrows, e.g. "1. Rider App -> API Gateway -> Dispatch Service" etc, all the way through to a locked-in match
3. the async flow as a SEPARATE numbered sequence (driver location updates feeding the index continuously, and the offer timeout/retry loop), explicitly marked "async - different color in the diagram"
4. one line per component: what shape to draw it as in Excalidraw and a short label (e.g. "rectangle: Dispatch Service - ranks and sends ride offers")
5. a one-line note on what NOT to draw as a core box: auth, logging, analytics — these go in as small supporting blocks off to the side only

Keep it to ONE ride request's journey, not the whole Uber platform.
```

---

That's the full pattern — every future row gets the same two-section treatment, fully specific to that day's topic, no placeholders left for Taral to fill in.
