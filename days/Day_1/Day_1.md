# Day 1 — 16 Aug 2026 — Multiplayer Games: How do real-time player actions sync across all players?

**main question:** How do player inputs reach other players with minimal latency while maintaining game consistency and fairness?

**hld/excalidraw focus (from calendar):** Player client → input stream → authoritative server → state update → broadcast to connected clients; show tick rate, client-side prediction, server reconciliation, and latency compensation.

---

## 1. concept explanation

the question: how do dozens of players see each other move, shoot, and react in near real time, without the game falling apart from lag or players cheating their own position?

how it actually works: here's one way this could be designed at scale, split into two layers that do very different jobs.

**layer 1: matchmaking and routing.** this layer's only job is answering one question: "which game server should this client connect to?" every client (player 1 through player N) connects first to a game gateway, not directly to a game server. the gateway is just a front door, it doesn't know anything about game logic. it forwards each client to an authoritative game management platform, which is the actual brain of this layer. that platform tracks which rooms exist, which game server each room lives on, and how loaded each server currently is. when a client asks to join, the platform looks up something like "room 1 lives on game server 1" and tells the client to connect there. this layer scales horizontally just by adding more game servers behind it, the management platform is just doing lookup and load balancing, it's not running any actual gameplay.

**layer 2: the game server and its rooms.** once a client is routed to a specific game server, that server is where the real work happens. each game server doesn't run just one game, it hosts many independent rooms at once (room 1, room 2, room 3...), and each room has its own set of players (player 101, 202, 301...) and its own isolated game state. this is where the tick loop, input processing, and state broadcast for that specific match actually happen, one room's state update never touches another room's. this is also why the layer 1 lookup matters so much: it's not enough to know "which server", the platform has to route you to the right room on the right server, since a server can't just guess which of its rooms you belong in.

trade-offs worth knowing:
- separating matchmaking (layer 1) from game simulation (layer 2) means you can scale each independently, add more game servers without touching the routing layer, or make routing smarter without redeploying game logic
- the authoritative game management platform becomes a single lookup point every client depends on before they can even join a match, so it needs to be fast and highly available or the whole "which server do I connect to" step becomes the bottleneck
- packing many rooms onto one game server is efficient (better hardware utilization) but means one overloaded or crashing game server can take down several unrelated matches at once, room isolation has to be real, not just logical

---

## 2. gemini prompt

```
Build a basic high-level design skeleton for: "how do real-time player actions sync across all players" (multiplayer game state sync, one player's input traveling to an authoritative server and back out to all clients).

Lay it out in five groups, left to right / top to bottom:
1. user surfaces (left): Player Client A, Player Client B, Player Client C
2. API / edge layer (next): Game Gateway / Connection Handler (handles websocket/UDP connections per player)
3. core services (center): Authoritative Game Server, Tick Simulation Loop, Server Reconciliation Logic, Lag Compensation / Hit Validation
4. async / event-driven (below core services): Input Stream Queue (per-player buffered inputs waiting for next tick), State Broadcast Publisher (pushes state snapshots out every tick)
5. data stores / external (right): In-Memory Game State Store, Match/Session Store, Player Session Metadata DB

Give me:
1. the component list grouped exactly as above
2. the primary synchronous flow as numbered arrows, e.g. "1. Player Client A -> Game Gateway -> Input Stream Queue" etc, all the way through the server tick processing input, updating state, and broadcasting the new state back to all clients
3. the async flow as a SEPARATE numbered sequence (client-side prediction running locally before server confirmation, and the tick-based state broadcast loop going out to all connected clients), explicitly marked "async - different color in the diagram"
4. one line per component: what shape to draw it as in Excalidraw and a short label (e.g. "rectangle: Authoritative Game Server - runs fixed tick rate simulation" / "cylinder: In-Memory Game State Store - current positions and world state")
5. a one-line note on what NOT to draw as a core box: auth, matchmaking, analytics, chat, these go in as small supporting blocks off to the side only

Keep it to ONE player's input traveling through one tick cycle and back out to all clients, not the whole game platform.
```

---

## 3. linkedin post

```
ever wondered how multiplayer games actually work under the hood

like when you hit "play" and get dropped into a match with 500 other people online at once, whats actually happening in those 2 seconds of loading screen

theres a moment right before you join where your app is silently asking a question you never see. "out of every server running right now, which one should this exact player land on". and the answer isnt random, its a whole lookup system deciding it for you in milliseconds

theres actually two completely separate layers doing this, and most people assume its just one big system

layer 1 doesnt run any gameplay at all. its pure traffic control. your client hits a gateway first, the gateway asks a management platform "where does this player belong", that platform knows exactly which room lives on which server and routes you there. zero game logic happening here, its just a really fast decision engine

layer 2 is where you actually land. and heres the part that surprised me, one server isnt running your match alone. its running dozens of rooms at the same time, each one fully isolated, its own players, its own state, its own tick loop updating everyone's positions in real time. your room never even knows the others exist

why split it like this instead of just building one giant system. because it lets you scale each half completely independently, and it means one crowded room cant take down someone elses match
```

---

## 4. twitter / x post

```
ever wondered what actually happens in the 2 sec loading screen before a multiplayer match starts

your client is asking "which server do i even belong on" and a whole routing layer answers it before you ever touch a game server

two layers, two completely different jobs
```

![alt text](image-1.png)
![alt text](image-2.png)