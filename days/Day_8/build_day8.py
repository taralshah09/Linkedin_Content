import sys
sys.path.insert(0, r"D:/Linkedin_Content/.claude/skills/excalidraw-hld")
from builder import Canvas, INK, ACCENT

c = Canvas()

# ---- group 1: actors (left) ------------------------------------------------
actors = c.container(20, 70, 240, 200, title="Customer")
app = c.rect(50, 120, 180, 120, rounded=True)
c.label(app, "Customer App\n\nOrder History\ntaps 'return'\npicks a reason")

# ---- group 2: edge bar -----------------------------------------------------
gw = c.vbar(320, 90, "API GATEWAY", h=170)

# ---- group 3: core services (center) ---------------------------------------
core = c.container(430, 40, 620, 470, title="Core services (return pipeline)")

policy = c.rect(460, 90, 250, 110, rounded=True)
c.label(policy, "Return Policy Engine\n\nreturn window? category?\nreason eligible?")

orch = c.rect(460, 250, 250, 120, rounded=True)
c.label(orch, "Return Orchestrator\n\nlong-running state machine\nrequested/picked/inspected")

pickup = c.rect(770, 90, 250, 110, rounded=True)
c.label(pickup, "Pickup Scheduler\n\nbooks courier slot\ngenerates return label")

inspect = c.rect(770, 250, 250, 110, rounded=True)
c.label(inspect, "Warehouse Inspection\n\nmatches order? damaged?\ntags / serials intact?")

refund = c.rect(460, 410, 250, 80, rounded=True)
c.label(refund, "Refund Service\n\nrefunds original method")

invsvc = c.rect(770, 410, 250, 80, rounded=True)
c.label(invsvc, "Inventory Service\n\nrestock or writeoff")

# ---- group 4: async / event-driven (below core) ----------------------------
asyncbox = c.container(430, 590, 620, 210, title="Async / event-driven")

bus = c.rect(460, 640, 250, 130, rounded=False)
c.label(bus, "Event Bus\n\nreturn:requested\nreturn:picked_up\nreturn:inspected\nreturn:refunded")

rlog = c.rect(770, 640, 250, 55, rounded=True)
c.label(rlog, "Reverse Logistics / Courier")

notif = c.rect(770, 715, 250, 55, rounded=True)
c.label(notif, "Notification Service")

# ---- group 5: data stores / external (right) -------------------------------
order_db = c.cylinder(1130, 90, 120, 130, caption="Order DB")
returns_db = c.cylinder(1130, 300, 120, 130, caption="Returns DB")
inv_db = c.cylinder(1130, 430, 120, 130, caption="Inventory DB")
pay = c.rect(1120, 640, 150, 90, rounded=True)
c.label(pay, "Refund /\nPayment Gateway\n\n(external)")

# ---- synchronous flow ------------------------------------------------------
c.arrow(app, gw)
c.arrow(gw, policy)
c.arrow(policy, orch, from_side="B", to_side="T")
c.arrow(orch, pickup, from_side="R", to_side="L", start_frac=0.3)
c.arrow(pickup, inspect, from_side="B", to_side="T")
# DB reads must dodge the middle column -> route through the clear inter-row gaps
c.free_arrow(710, 165, 1190, 220, waypoints=[(710, 225), (1190, 225)])   # policy -> Order DB (gap above orch row)
c.free_arrow(690, 370, 1190, 430, waypoints=[(690, 390), (1190, 390)])   # orch  -> Returns DB (gap below inspect row)
# refund -> external gateway: route right through the gap under the core row (dodges bus + inv_db)
c.free_arrow(585, 490, 1190, 640, waypoints=[(585, 600), (1190, 600)])
c.arrow(invsvc, inv_db, from_side="R", to_side="L")

# ---- async / event flow (dashed blue) --------------------------------------
# orch/inspect emit to the bus down the clear middle lane (x~740) so they miss refund/invsvc
c.free_arrow(710, 340, 710, 670, waypoints=[(740, 340), (740, 670)], dashed=True, color=ACCENT)
c.async_arrow(bus, rlog, from_side="R", to_side="L", start_frac=0.3)
c.free_arrow(770, 320, 650, 640, waypoints=[(745, 320), (745, 620), (650, 620)], dashed=True, color=ACCENT)
c.async_arrow(bus, refund, from_side="T", to_side="B", start_frac=0.3)
c.async_arrow(bus, invsvc, from_side="T", to_side="B", start_frac=0.7, end_frac=0.7)
c.async_arrow(bus, notif, from_side="R", to_side="L", start_frac=0.7)

# ---- annotations -----------------------------------------------------------
c.callout(470, 540, "refund fires AFTER inspection passes, not on pickup")
c.note(1130, 760, "resellable -> sellable stock\ndamaged -> writeoff")

c.save(r"D:/Linkedin_Content/days/Day_8/Day_8.excalidraw")
print("OK wrote Day_8.excalidraw with", len(c.elements), "elements")
