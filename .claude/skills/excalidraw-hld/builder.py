"""
excalidraw-hld builder
----------------------
A tiny, dependency-free helper that emits a valid .excalidraw JSON file in
Taral's dark-canvas / hand-drawn HLD style.

Why a library instead of hand-writing JSON?
  Excalidraw elements need: unique ids, seeds, version/versionNonce, and
  *bidirectional* bindings (a container lists its text in boundElements AND the
  text points back via containerId; an arrow names both boxes AND both boxes
  list the arrow). Getting one direction wrong makes the file look fine until
  you drag a box and labels/arrows detach. This library keeps both sides in
  sync automatically, so generated files stay clean when moved.

Design tokens (Taral's style, extracted from Days 1-5):
  - theme "dark" + light-theme stored colors -> Excalidraw's invert filter
    renders near-black strokes as near-white on a dark canvas (native behaviour
    of a real dark-mode export).
  - monochrome INK (#1e1e1e -> appears white), transparent fills.
  - ONE accent, ACCENT blue (#1971c2 -> appears light blue), callout text only.
  - hand-drawn font (fontFamily 1 = Virgil/Excalifont), roughness 1, thin strokes.

Usage sketch (see SKILL.md for the full recipe):

    from builder import Canvas, INK, ACCENT

    c = Canvas()
    grp = c.container(40, 60, 300, 500, title="Actors")     # dashed group box
    a = c.rect(80, 120, 200, 60); c.label(a, "customer app")
    bar = c.vbar(380, 60, "API GATEWAY")                     # vertical rotated bar
    svc = c.rect(460, 120, 220, 120, rounded=True)
    c.label(svc, "Rider Service\n\ncreates a ride\nSTATUS = Requested")
    db = c.cylinder(900, 600, 120, 140, caption="Order DB")
    c.arrow(a, bar); c.arrow(bar, svc)
    c.note(460, 260, "driver has 10-15s to accept or ignore")   # free annotation
    c.callout(460, 300, "Which server do I connect to?")        # blue callout
    c.save("out.excalidraw")
"""

import json
import random

# --- design tokens ---------------------------------------------------------
INK = "#1e1e1e"        # stored dark -> renders near-white in dark theme
ACCENT = "#1971c2"     # excalidraw blue -> renders light blue; callouts ONLY
FILL = "transparent"
FONT_HAND = 1          # Virgil / Excalifont (hand-drawn look)
BG = "#ffffff"         # stored light -> dark theme inverts to near-black canvas


class Canvas:
    def __init__(self, seed=7):
        self.elements = []
        self.geom = {}          # id -> (x, y, w, h) for arrow anchoring
        self._rng = random.Random(seed)
        self._n = 0

    # -- internals ----------------------------------------------------------
    def _id(self, prefix="el"):
        self._n += 1
        return f"{prefix}-{self._n:03d}"

    def _seed(self):
        return self._rng.randint(1, 2**31)

    def _base(self, **kw):
        e = {
            "id": kw.get("id") or self._id(),
            "type": kw["type"],
            "x": kw["x"], "y": kw["y"],
            "width": kw["width"], "height": kw["height"],
            "angle": kw.get("angle", 0),
            "strokeColor": kw.get("strokeColor", INK),
            "backgroundColor": kw.get("backgroundColor", FILL),
            "fillStyle": kw.get("fillStyle", "solid"),
            "strokeWidth": kw.get("strokeWidth", 1),
            "strokeStyle": kw.get("strokeStyle", "solid"),
            "roughness": kw.get("roughness", 1),
            "opacity": kw.get("opacity", 100),
            "groupIds": kw.get("groupIds", []),
            "frameId": None,
            "roundness": kw.get("roundness", None),
            "seed": self._seed(),
            "version": 1,
            "versionNonce": self._seed(),
            "isDeleted": False,
            "boundElements": kw.get("boundElements", []),
            "updated": 1,
            "link": None,
            "locked": False,
        }
        self.elements.append(e)
        self.geom[e["id"]] = (e["x"], e["y"], e["width"], e["height"])
        return e

    def _find(self, eid):
        for e in self.elements:
            if e["id"] == eid:
                return e
        return None

    # -- shapes -------------------------------------------------------------
    def rect(self, x, y, w, h, rounded=False, dashed=False, stroke=INK):
        return self._base(
            type="rectangle", x=x, y=y, width=w, height=h, strokeColor=stroke,
            strokeStyle="dashed" if dashed else "solid",
            roundness={"type": 3} if rounded else None,
        )["id"]

    def ellipse(self, x, y, w, h, stroke=INK, dashed=False):
        return self._base(type="ellipse", x=x, y=y, width=w, height=h,
                           strokeColor=stroke,
                           strokeStyle="dashed" if dashed else "solid")["id"]

    def diamond(self, x, y, w, h, stroke=INK):
        return self._base(type="diamond", x=x, y=y, width=w, height=h,
                          strokeColor=stroke)["id"]

    # -- text ---------------------------------------------------------------
    def text(self, x, y, s, size=16, color=INK, align="left", angle=0,
             group=None):
        lines = s.split("\n")
        w = max((len(ln) for ln in lines), default=1) * size * 0.55
        h = len(lines) * size * 1.25
        e = self._base(type="text", x=x, y=y, width=w, height=h,
                       strokeColor=color, angle=angle,
                       groupIds=[group] if group else [])
        e.update({
            "text": s, "originalText": s, "fontSize": size,
            "fontFamily": FONT_HAND, "textAlign": align,
            "verticalAlign": "top", "containerId": None,
            "lineHeight": 1.25, "autoResize": True, "baseline": h - 4,
        })
        return e["id"]

    def note(self, x, y, s, size=16):
        """Free-floating monochrome annotation (constraints, schemas, notes)."""
        return self.text(x, y, s, size=size, color=INK, align="left")

    def callout(self, x, y, s, size=16):
        """Blue accent callout text. Use SPARINGLY, questions/annotations only."""
        return self.text(x, y, s, size=size, color=ACCENT, align="left")

    # -- bound label inside a box -------------------------------------------
    def label(self, container_id, s, size=16, color=INK):
        """Bind a centered multi-line text label to a rectangle/diamond/ellipse.
        First line = title, following lines = body (blank line for spacing)."""
        cont = self._find(container_id)
        cx, cy, cw, ch = self.geom[container_id]
        lines = s.split("\n")
        w = min(cw - 20, max((len(ln) for ln in lines), default=1) * size * 0.55)
        h = len(lines) * size * 1.25
        tid = self._id("text")
        t = self._base(
            type="text", id=tid,
            x=cx + (cw - w) / 2, y=cy + (ch - h) / 2, width=w, height=h,
            strokeColor=color,
        )
        t.update({
            "text": s, "originalText": s, "fontSize": size,
            "fontFamily": FONT_HAND, "textAlign": "center",
            "verticalAlign": "middle", "containerId": container_id,
            "lineHeight": 1.25, "autoResize": True, "baseline": h - 4,
        })
        cont["boundElements"] = cont.get("boundElements", []) + [
            {"type": "text", "id": tid}]
        return tid

    # -- composite: dashed group container with title above top-left --------
    def container(self, x, y, w, h, title=None, number=None, stroke=INK):
        """Large DASHED grouping rectangle. Optional title sits just above its
        top-left corner; optional `number` draws a small numbered circle to the
        left of the title (Day-5 style numbered step flow)."""
        rid = self.rect(x, y, w, h, dashed=True, stroke=stroke)
        tx = x
        if number is not None:
            r = 14
            self.ellipse(x - 2, y - 34, 2 * r, 2 * r, stroke=stroke)
            self.text(x + 3, y - 30, str(number), size=15, color=stroke)
            tx = x + 34
        if title:
            self.text(tx, y - 28, title, size=17, color=stroke)
        return rid

    # -- composite: tall thin vertical bar with rotated 90 label ------------
    def vbar(self, x, y, label, h=280, w=44):
        """Gateway / ingestion / routing bar. Label rendered vertical (reads
        bottom-to-top), e.g. 'API GATEWAY', 'INGESTION LAYER'."""
        rid = self.rect(x, y, w, h, rounded=True)
        # rotated free text, centered on the bar, reading bottom-to-top
        cx, cy = x + w / 2, y + h / 2
        size = 16
        tw = len(label) * size * 0.55
        self.text(cx - tw / 2, cy - size * 0.6, label, size=size, color=INK,
                  align="center", angle=-1.5708)
        return rid

    # -- composite: database cylinder with caption beneath ------------------
    def cylinder(self, x, y, w, h, caption=None):
        """Data store drawn as a cylinder (top ellipse + sides + bottom
        ellipse), with an optional caption label centered beneath it."""
        g = self._id("cyl")
        # register the cylinder's bounding box so arrow()/anchor math can target
        # a data store directly and route to it orthogonally (no diagonal hacks)
        self.geom[g] = (x, y, w, h)
        ry = min(h * 0.16, 22)
        self._base(type="ellipse", x=x, y=y, width=w, height=2 * ry,
                   groupIds=[g])                                   # top
        self._line(x, y + ry, 0, h - 2 * ry, g)                   # left side
        self._line(x + w, y + ry, 0, h - 2 * ry, g)              # right side
        self._base(type="ellipse", x=x, y=y + h - 2 * ry, width=w,
                   height=2 * ry, groupIds=[g])                    # bottom
        if caption:
            size = 15
            tw = len(caption) * size * 0.55
            self.text(x + (w - tw) / 2, y + h + 10, caption, size=size,
                      color=INK, align="center")
        return g

    # -- arrows -------------------------------------------------------------
    # Arrow routing is ORTHOGONAL by default: a connector leaves one box on a
    # chosen side, travels down a clear mid-lane, and enters the other box
    # square-on. This is what keeps generated diagrams looking like the Day 1-5
    # references (short axis-aligned hops) instead of long diagonals slicing
    # straight through boxes and their text (the Day 6/7 failure mode).
    ALIGN = 26        # <= this perpendicular offset -> keep it a straight hop

    def _anchor(self, box_id, side, frac=0.5):
        """Absolute point on `side` (L/R/T/B) of a box, `frac` along that edge.
        frac lets you fan several arrows off the same side without stacking."""
        x, y, w, h = self.geom[box_id]
        frac = min(0.85, max(0.15, frac))
        if side == "L":
            return x, y + h * frac
        if side == "R":
            return x + w, y + h * frac
        if side == "T":
            return x + w * frac, y
        return x + w * frac, y + h        # "B"

    def _auto_sides(self, from_id, to_id):
        """Pick facing sides from box geometry: exit toward the target, enter
        from the side the source is on. Dominant axis wins ties."""
        ax, ay, aw, ah = self.geom[from_id]
        bx, by, bw, bh = self.geom[to_id]
        dx = (bx + bw / 2) - (ax + aw / 2)
        dy = (by + bh / 2) - (ay + ah / 2)
        if abs(dx) >= abs(dy):
            return ("R", "L") if dx >= 0 else ("L", "R")
        return ("B", "T") if dy >= 0 else ("T", "B")

    def _route(self, sx, sy, ex, ey, from_side, to_side):
        """Absolute waypoints for a clean, axis-aligned connector.

        - near-aligned boxes  -> a single straight hop (like the references)
        - offset same-axis     -> a Z through the mid-lane between the columns/rows
        - perpendicular sides  -> an L-elbow
        Never a raw diagonal across the canvas."""
        horiz = ("L", "R")
        if from_side in horiz and to_side in horiz:
            if abs(sy - ey) <= self.ALIGN:
                return [(sx, sy), (ex, ey)]           # straight neighbour hop
            midx = (sx + ex) / 2                        # Z via vertical mid-lane
            return [(sx, sy), (midx, sy), (midx, ey), (ex, ey)]
        if from_side not in horiz and to_side not in horiz:
            if abs(sx - ex) <= self.ALIGN:
                return [(sx, sy), (ex, ey)]           # straight neighbour hop
            midy = (sy + ey) / 2                        # Z via horizontal mid-lane
            return [(sx, sy), (sx, midy), (ex, midy), (ex, ey)]
        # mixed sides -> L-elbow, turning once
        if from_side in horiz:
            return [(sx, sy), (ex, sy), (ex, ey)]
        return [(sx, sy), (sx, ey), (ex, ey)]

    def arrow(self, from_id, to_id, dashed=False, color=INK, label=None,
              from_side=None, to_side=None, start_frac=0.5, end_frac=0.5,
              route="auto"):
        """Bound arrow between two boxes, orthogonally routed by default.

        Override sides/fracs to control exactly where it leaves and lands
        (essential when a box has several arrows on one side):
          c.arrow(a, b, from_side="R", to_side="L", start_frac=0.3)
        route="straight" forces a direct segment (use only for short hops in
        open space); route="auto" (default) keeps it axis-aligned."""
        return self._arrow(from_id, to_id, dashed, color, label,
                           from_side, to_side, start_frac, end_frac, route)

    def async_arrow(self, from_id, to_id, label=None, from_side=None,
                    to_side=None, start_frac=0.5, end_frac=0.5, route="auto"):
        """Async / event-driven flow -> visibly distinct: dashed + accent."""
        return self._arrow(from_id, to_id, dashed=True, color=ACCENT,
                           label=label, from_side=from_side, to_side=to_side,
                           start_frac=start_frac, end_frac=end_frac, route=route)

    def _arrow(self, from_id, to_id, dashed, color, label,
               from_side=None, to_side=None, start_frac=0.5, end_frac=0.5,
               route="auto"):
        fs, ts = self._auto_sides(from_id, to_id)
        from_side = from_side or fs
        to_side = to_side or ts
        sx, sy = self._anchor(from_id, from_side, start_frac)
        ex, ey = self._anchor(to_id, to_side, end_frac)
        if route == "straight":
            pts = [(sx, sy), (ex, ey)]
        else:
            pts = self._route(sx, sy, ex, ey, from_side, to_side)
        aid = self._id("arrow")
        px, py = pts[0]
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        e = self._base(
            type="arrow", id=aid, x=px, y=py,
            width=max(xs) - min(xs), height=max(ys) - min(ys),
            strokeColor=color, strokeStyle="dashed" if dashed else "solid",
        )
        # Bind only to real elements. Composite shapes (cylinder = a group of
        # ellipses+lines) expose a group id that is not a bindable element, so
        # that endpoint stays unbound but is still routed to geometrically.
        start_real = self._find(from_id) is not None
        end_real = self._find(to_id) is not None
        e.update({
            "points": [[p[0] - px, p[1] - py] for p in pts],
            "lastCommittedPoint": None,
            "startBinding": ({"elementId": from_id, "focus": 0, "gap": 6}
                             if start_real else None),
            "endBinding": ({"elementId": to_id, "focus": 0, "gap": 6}
                           if end_real else None),
            "startArrowhead": None, "endArrowhead": "arrow", "elbowed": False,
        })
        for eid in (from_id, to_id):
            box = self._find(eid)
            if box is not None:
                box["boundElements"] = box.get("boundElements", []) + [
                    {"type": "arrow", "id": aid}]
        if label:
            # anchor the label to the connector's mid vertex, nudged clear of it
            mid = pts[len(pts) // 2]
            self.text(mid[0] - len(label) * 3.5, mid[1] - 20,
                      label, size=13, color=color)
        return aid

    # -- free arrow by coordinates (loops, fallbacks) -----------------------
    def free_arrow(self, x1, y1, x2, y2, dashed=False, color=INK,
                   waypoints=None):
        """Unbound arrow through explicit points. Pass `waypoints` (a list of
        (x, y) between start and end) to route it orthogonally around obstacles
        instead of cutting a diagonal:
          c.free_arrow(x1, y1, x2, y2, waypoints=[(x1, ymid), (x2, ymid)])"""
        pts = [(x1, y1)] + list(waypoints or []) + [(x2, y2)]
        aid = self._id("arrow")
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        e = self._base(type="arrow", id=aid, x=x1, y=y1,
                       width=max(xs) - min(xs), height=max(ys) - min(ys),
                       strokeColor=color,
                       strokeStyle="dashed" if dashed else "solid")
        e.update({
            "points": [[p[0] - x1, p[1] - y1] for p in pts],
            "lastCommittedPoint": None,
            "startBinding": None, "endBinding": None,
            "startArrowhead": None, "endArrowhead": "arrow", "elbowed": False,
        })
        return aid

    def _line(self, x, y, dx, dy, group):
        e = self._base(type="line", x=x, y=y, width=abs(dx), height=abs(dy),
                       groupIds=[group])
        e.update({
            "points": [[0, 0], [dx, dy]],
            "lastCommittedPoint": None,
            "startBinding": None, "endBinding": None,
            "startArrowhead": None, "endArrowhead": None,
        })
        return e["id"]

    # -- output -------------------------------------------------------------
    def save(self, path):
        doc = {
            "type": "excalidraw",
            "version": 2,
            "source": "excalidraw-hld skill",
            "elements": self.elements,
            "appState": {
                "gridSize": None,
                "viewBackgroundColor": BG,
                "theme": "dark",
            },
            "files": {},
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=2)
        return path
