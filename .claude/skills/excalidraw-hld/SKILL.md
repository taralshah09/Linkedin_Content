---
name: excalidraw-hld
description: "Generate a valid .excalidraw JSON file (importable into excalidraw.com) for a system-design / HLD topic, in Taral's dark-canvas, monochrome, hand-drawn visual style — five logical groups (actors / edge / core / async / stores), dashed containers, vertical gateway bars, cylinder data stores, blue callouts. Use when asked to draw/generate an HLD or Excalidraw diagram for a topic, main question, or a Day_N.md file. Triggers on 'excalidraw diagram for', 'draw the HLD', 'make the excalidraw for day N', '/excalidraw-hld'."
trigger: /excalidraw-hld
---

# excalidraw-hld

Generate a `.excalidraw` JSON file for a system-design / HLD topic that opens cleanly on
excalidraw.com in dark theme with the hand-drawn look, matching Taral's established visual
style (Days 1–5). You author a short Python layout script that calls the bundled
`builder.py`; the builder guarantees valid schema and correct two-way bindings, so boxes,
labels, and arrows stay attached when dragged.

## Input

One of:
- a **topic / main question / HLD focus** pasted directly, or
- a reference to a **`days/Day_N/Day_N.md`** file — in that case, READ it and reuse its
  **"gemini prompt"** section's five-group component list and flows verbatim as the diagram
  structure (this is the grouping Taral already designed). Also read the
  **"hld/excalidraw focus"** line for the intended flow.

If neither is available, ask for the topic and, if useful, the five-group breakdown.

## Output

A `.excalidraw` file written to the relevant `days/Day_N/` folder (or a path the user
specifies), plus a short summary of the components drawn and the exact import path.

Optionally (and always, when run as part of the `/day` pipeline) a `Day_N.png` snapshot
rendered from that `.excalidraw` through excalidraw.com itself, so it matches the
dark-canvas / hand-drawn house style. See "Rendering to PNG" below — do NOT re-draw the
diagram with Pillow/SVG, it will not match.

---

## The visual style (encode these — do not deviate)

- **Dark canvas, monochrome.** Near-white strokes/text on near-black. The builder achieves
  this natively: it stores light-theme colors (`INK = #1e1e1e`) with `appState.theme:"dark"`,
  and Excalidraw's dark-mode invert filter renders them light. Do NOT store white strokes —
  they would invert to black and vanish.
- **Hand-drawn.** `fontFamily:1` (Virgil/Excalifont), `roughness:1`, thin `strokeWidth:1`,
  `backgroundColor:"transparent"`. All baked into the builder defaults.
- **ONE accent — blue** (`ACCENT`), used ONLY for callout text / annotations
  (e.g. "which game server should I connect to?"). Never for boxes or the main flow.
- **Left→right, top→bottom, in FIVE logical groups:**
  1. user surfaces / actors (left)
  2. API / edge layer (next) — draw as a **vertical bar**
  3. core services (center)
  4. async / event-driven (below core)
  5. data stores / external (right) — draw as **cylinders**
- **Dashed containers.** Group related components in a large DASHED rectangle with a title
  text just above its top-left corner ("Core services (Command / Write Side)",
  "Event Bus / Event Streaming Platform"). For step-by-step flows, number the containers
  with a small circle + short title (Day 5: "1 find nearest Dark store").
- **Components** are rectangles (mix sharp and slightly-rounded). A box has a bold-ish title
  line and, optionally, a few short body lines describing what it does — keep body text terse,
  concrete examples ("consumes events from ride:requested stream and starts matching").
- **Gateways / ingestion / routing** = tall thin vertical bars with the label rotated 90°:
  "GAME GATEWAY", "API GATEWAY", "INGESTION LAYER", "ROUTING SERVICE".
- **Data stores** = cylinders with a caption beneath (Order DB, Location Store, Cache…),
  lined up in a row along the bottom/right.
- **Arrows:** thin solid for the synchronous flow. Make async / event-driven flow visibly
  distinct — **dashed + blue** (`async_arrow`). Retry/fallback loops and timeout logic go in
  their OWN small cluster off to the side, not inline in the main flow.
  **Arrow placement is the thing that most often looks wrong — treat it as a first-class
  layout concern, not an afterthought.** See "Arrow placement rules" below.
- **Free-floating annotations** liberally beneath/around boxes for constraints and notes
  ("driver has 10-15s to accept or ignore", key/value schemas, fallback radius steps).
- **ONE request's journey end-to-end** (one ride, one order, one route) — not the whole
  platform. Auth, logging, analytics, chat, payments = small supporting blocks off to the
  side only, never core boxes.

---

## Arrow placement rules (READ — this is where the diagrams go wrong)

The Day 1–5 references (see `Excalidraw_design_references.md`) connect boxes with **short,
axis-aligned hops that travel through the empty lanes between boxes**. An arrow leaves one box
square-on from one side, runs straight (horizontal or vertical), and enters the next box
square-on. Arrows almost never cross a third box or any text.

The earlier auto-generated diagrams (Day 6, Day 7) looked wrong for one reason: **long straight
diagonals drawn center-to-center between far-apart boxes**, which slice diagonally across the
core containers and overlap other boxes, labels, and callouts. Do not reproduce that. Concretely:

- **NEVER connect two far-apart, non-adjacent boxes with a raw diagonal.** No arrow may pass
  *through* a box, a bound label, a container title, or a callout. If a straight line between
  two boxes would cross a third element, the layout or the routing is wrong — fix it.
- **`c.arrow(a, b)` now routes orthogonally by default** (straight hop when the boxes are
  roughly aligned; an L- or Z-elbow through the mid-lane otherwise). Prefer it. Use
  `route="straight"` only for short hops in genuinely open space.
- **Design the layout so arrows are neighbour-to-neighbour.** Place boxes that talk to each
  other in adjacent columns/rows and leave a clear **≥60px lane** between columns and between
  rows for connectors to run down. If two boxes must connect, put them next to each other.
- **Put each data store directly to the right of (or directly below) the service that uses
  it**, so the arrow is one short horizontal/vertical hop — not a diagonal across the canvas.
  Arrow straight into the cylinder: `c.arrow(order_service, order_db)` (cylinders are now valid
  arrow targets; the endpoint on the store is routed even though it stays unbound).
- **When one box has several arrows on the same side, fan them out** with `from_side`/`to_side`
  and `start_frac`/`end_frac` (0.15–0.85 along the edge) so they don't stack into one line:
  `c.arrow(orch, pricing, from_side="B", start_frac=0.3)` and
  `c.arrow(orch, inventory, from_side="B", start_frac=0.7)`.
- **Keep async (blue dashed) arrows inside the async band.** They should connect the core
  service to the event bus and the event bus to its consumers with short hops — never a long
  blue diagonal cutting back up through the core services box.
- **Retry/fallback/timeout loops live in their own side cluster** and connect with
  `free_arrow(..., waypoints=[...])` routed orthogonally — not inline across the main flow.
- After generating, **re-read the arrow points**: every segment should be horizontal or
  vertical (or a short near-aligned hop). A long diagonal in the emitted `points` is a red flag.

---

## How to build it

Write a Python script next to `builder.py` (or `import sys; sys.path` to it) that lays the
diagram out on a grid, then run it. **Always `import` and reuse `builder.py`** — never
hand-write raw Excalidraw JSON.

### Layout grid (five columns, generous spacing to avoid overlap)

| group | column x | notes |
|---|---|---|
| 1 actors | 40 | stack boxes vertically, ~70px pitch |
| 2 edge bar | ~320 | `vbar`, tall |
| 3 core services | ~440 | center; can be a dashed `container` holding boxes |
| 4 async / events | ~440, below core (y ≈ 480+) | dashed `container`; use `async_arrow` in/out |
| 5 stores | ~980 | column of `cylinder`s, or a row along the bottom |

Box width ~180–240, height 60–140. Leave ≥60px gaps. Put a title line first, blank line,
then 2–4 short body lines. For numbered step-flows (Day-5 style), use one `container(...,
number=n, title=...)` per step across the top and let each hold its sub-steps.

**Lay out for the arrows, not just the boxes.** Keep the empty gaps between columns and rows
wide enough (≥60px) that a connector can run straight down them without touching a box. Place
communicating boxes in adjacent columns/rows so every arrow is a short hop. Put each cylinder
store in the right-hand column on the **same row** as the service that reads/writes it, so the
arrow is a single horizontal segment. If you find yourself wanting a long diagonal, move a box
instead.

### Builder API (see `builder.py` for full docstrings)

```python
from builder import Canvas, INK, ACCENT
c = Canvas()

# grouping box (dashed, title above top-left; number => numbered step circle)
g   = c.container(x, y, w, h, title="Core services (Command / Write Side)")
s1  = c.container(x, y, w, h, title="find nearest Dark store", number=1)

# component box + bound centered label (line 1 = title, blank line, then body)
box = c.rect(x, y, w, h, rounded=True)          # rounded=False for sharp
c.label(box, "Dispatch Service\n\nconsumes ride:requested\nstarts matching")

c.vbar(x, y, "API GATEWAY", h=280)              # vertical rotated gateway bar
db = c.cylinder(x, y, w, h, caption="Order DB")  # data store + caption beneath
d  = c.diamond(x, y, w, h)                       # decision, if needed

# flow — arrows route ORTHOGONALLY by default (no diagonals through boxes)
c.arrow(a, b)                                    # solid sync arrow, auto-routed
c.arrow(svc, db)                                 # cylinders are valid targets now
c.arrow(orch, pricing, from_side="B", start_frac=0.3)    # pick side + fan-out point
c.arrow(orch, inv,     from_side="B", start_frac=0.7)    # second arrow off same side
c.async_arrow(b, q, label="event")              # dashed + blue async/event arrow
c.free_arrow(x1, y1, x2, y2, dashed=True, color=ACCENT,
             waypoints=[(x1, ym), (x2, ym)])     # retry/fallback loop, routed orthogonally

# free text
c.note(x, y, "driver has 10-15s to accept or ignore")    # monochrome annotation
c.callout(x, y, "which server do I connect to?")         # BLUE — sparingly

c.save("D:/Linkedin_Content/days/Day_N/Day_N.excalidraw")
```

Notes:
- `arrow(a, b)` auto-picks facing edges, routes the connector axis-aligned (straight hop, or
  an L/Z elbow through the mid-lane), and binds both directions. Override with
  `from_side`/`to_side` ∈ {"L","R","T","B"} and `start_frac`/`end_frac` ∈ [0.15, 0.85].
- Cylinders (data stores) are valid arrow targets — arrow straight into them; the store-side
  endpoint is routed geometrically even though it stays unbound (a cylinder is a shape group).
- `label`/`vbar`/`cylinder` captions size themselves; keep lines short so text fits.
- Accent (`ACCENT` / `callout` / `async_arrow`) is the ONLY color besides ink. Keep it rare.

### Reference element snippet (what the builder emits — for schema grounding)

A rectangle with a bound label and an outgoing bound arrow looks like this:

```json
{
  "type": "rectangle", "id": "el-004", "x": 440, "y": 120,
  "width": 220, "height": 130, "angle": 0,
  "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
  "fillStyle": "solid", "strokeWidth": 1, "strokeStyle": "solid",
  "roughness": 1, "opacity": 100, "groupIds": [], "frameId": null,
  "roundness": { "type": 3 }, "seed": 12345, "version": 1,
  "versionNonce": 67890, "isDeleted": false,
  "boundElements": [ { "type": "text", "id": "text-005" },
                     { "type": "arrow", "id": "arrow-020" } ],
  "updated": 1, "link": null, "locked": false
}
```
The bound text has `"containerId": "el-004"`, `"textAlign":"center"`,
`"verticalAlign":"middle"`, `"fontFamily":1`. The arrow has
`"startBinding": {"elementId":"...","focus":0,"gap":4}`, matching `endBinding`,
`"points": [[0,0],[dx,dy]]`, `"endArrowhead":"arrow"`. The file wraps elements in
`{"type":"excalidraw","version":2,"appState":{"theme":"dark",
"viewBackgroundColor":"#ffffff","gridSize":null},"files":{}}`.

---

## Procedure

1. Resolve input → a five-group component list + a sync flow + an async flow. If given a
   `Day_N.md`, READ it and lift the "gemini prompt" grouping and flows directly.
2. Write a layout script importing `builder.py`; place groups across the five columns with
   generous spacing; add labels, the vertical edge bar, cylinder stores, arrows (solid sync,
   dashed-blue async), a side cluster for any retry/fallback, and free-floating annotations.
3. Run the script to emit the `.excalidraw` file into the target folder.
4. Sanity-check: the script ran without error and the JSON parses. (The builder guarantees
   required keys and two-way bindings.) **Also inspect the arrows:** iterate the emitted
   `arrow` elements and confirm every segment in `points` is horizontal or vertical (or a short
   near-aligned hop) — no long diagonal that would cross a box or text. If any diagonal crosses
   another element, adjust the layout (move a box / add a lane) or the routing (`from_side`,
   `to_side`, `waypoints`) and re-run.
5. Report to the user: a short bullet list of the components/groups drawn, and the **exact
   file path** to import at excalidraw.com (File → Open, or drag the file in).
6. If a PNG snapshot is wanted (always, in the `/day` pipeline), render it with the bundled
   `render.js` — see below.

Keep the diagram to one request's journey. Prefer fewer, well-labeled boxes over clutter.

---

## Rendering to PNG (house style, headless — one command)

The `.excalidraw` file is rendered to PNG **through excalidraw.com itself** so it matches the
established dark-canvas / hand-drawn look. This is fully automated by the bundled
`render.js`; do NOT re-implement the browser dance each time, and do NOT re-draw with
Pillow/SVG (it won't match). Just run:

```bash
node "D:/Linkedin_Content/.claude/skills/excalidraw-hld/render.js" \
     "D:/Linkedin_Content/days/Day_N/Day_N.excalidraw"
```

It writes `Day_N.png` next to the `.excalidraw` (or pass an explicit output path as a 2nd
arg) and prints `RESULT: WROTE ... validPNG=true dims=WxH`. A correct run is a 3x image
(e.g. a ~1600px-wide scene → ~4800px PNG) on a near-black canvas with near-white strokes.
After it runs, open the PNG to visually confirm it rendered (dark background, nothing
clipped). Then you're done — no server to stop, no scratch files to clean.

### What render.js does (and why — so it's not rediscovered)

- **Drives Chromium directly via `playwright-core` from Node.** The Playwright MCP browser
  tools are frequently unavailable in-session, but a full Chromium + `playwright-core`
  already ship on this machine. `render.js` auto-discovers both (newest
  `~/AppData/Local/ms-playwright/chromium-*` executable; `playwright-core` from the global
  tool that bundles it), so no `npm install` and no MCP server are needed.
- **Seeds the scene straight into `localStorage`, not via a fetch.** excalidraw.com's CSP
  blocks cross-origin `fetch()` — even from a `127.0.0.1` server — so the "serve the folder +
  fetch it in the page" approach fails with *"Failed to fetch"*. Instead render.js reads the
  `.excalidraw` in Node and passes `scene.elements` directly into `page.evaluate()` to set
  `localStorage['excalidraw']`, then reloads so excalidraw restores it.
- **Forces dark mode + 3x export via seeded state.** It seeds
  `excalidraw-state = {theme:'dark', viewBackgroundColor:'#ffffff', exportScale:3,
  exportBackground:true, exportWithDarkMode:true}`. `exportScale:3` is what makes the PNG
  come out at true 3x **without** having to click the export dialog's scale buttons (those
  buttons expose no accessible text and can't be targeted reliably).
- **Captures the PNG via a `toBlob` patch.** The headless save-file picker throws
  (`showSaveFilePicker is not a function`), but excalidraw calls `toBlob()` to build the
  full-resolution PNG *before* that failure. render.js patches
  `HTMLCanvasElement.prototype.toBlob` to keep the largest blob in `window.__capBlob`, opens
  the export dialog (Ctrl+Shift+E), clicks **Export to PNG** (`button[aria-label="Export to
  PNG"]`), then reads the blob back as chunked base64 and writes the bytes.

If a Chromium or `playwright-core` path ever moves, fix the discovery lists at the top of
`render.js` rather than reverting to a hand-written browser script.
