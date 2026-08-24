# Day 7 — 22 Aug 2026 — Amazon: How does the product search page rank results?

**main question:** How are query understanding, retrieval, ranking, personalization, and sponsored results combined?

**hld/excalidraw focus (from calendar):** Search box → query parser → candidate retrieval → ranking service → ads/personalization → response cache → results page.

---

## 1. concept explanation

the question: you type "wireless earbuds" into amazon and in a few hundred milliseconds you get a ranked page of products plus a couple of sponsored ones up top. how does that page get built and ordered?

how it actually works: when you hit search, your query first goes to a query understanding step. it gets tokenized, spell-corrected ("earbufs" -> "earbuds"), and enriched: it figures out intent (is this a category, a brand, a specific product?), pulls out attributes (wireless, price range if you said cheap), and expands synonyms so "earbuds" also matches "earphones". that cleaned-up query hits a retrieval layer that pulls a candidate set from a big inverted index (think tens of thousands of matching products), not the whole catalog. this first pass is tuned for recall, not precision. those candidates then flow into a ranking service. an early cheap model trims the set, then a heavier ml model scores each product on relevance, predicted purchase probability, price, reviews, delivery speed, seller quality, and your own signals (past purchases, browsing, prime status) for personalization. separately, an ads system runs its own auction over sponsored candidates and those slots get merged into the organic results at fixed positions. the final ordered page, plus common queries, gets cached so the next person searching the same thing skips most of that work.

trade-offs worth knowing:
- retrieval favors recall, ranking favors precision. you cast a wide cheap net first, then spend the expensive ml compute only on the survivors. ranking the entire catalog per query would never hit the latency budget
- personalization vs a shared cache fight each other. the more personalized the page, the less cacheable it is. amazon caches the heavy retrieval/base-ranking and layers lighter per-user reordering on top
- sponsored results trade user trust for revenue. push ads too hard and relevance drops, so the ad auction is blended with organic relevance, not just highest bid wins

---

## 2. gemini prompt

```
Build a basic high-level design skeleton for: "how does amazon's product search page rank results" (query understanding + retrieval + ranking + personalization + sponsored results, one search query end to end).

Lay it out in five groups, left to right / top to bottom:
1. user surfaces (left): Search Box / Results Page (web + mobile app)
2. API / edge layer (next): Search API Gateway
3. core services (center): Query Understanding Service, Candidate Retrieval Service, Ranking Service, Ads / Sponsored Service, Personalization Service
4. async / event-driven (below core services): Behavior Event Stream (clicks/purchases), Index Builder / Catalog Ingestion, Model Training Pipeline
5. data stores / external (right): Inverted Product Index, Product Catalog Store, User Profile / Signals Store, Response Cache

Give me:
1. the component list grouped exactly as above
2. the primary synchronous flow as numbered arrows, e.g. "1. Search Box -> Search API Gateway -> Query Understanding Service" etc, all the way through to the final ranked+sponsored results page returned to the user (include the cache check near the front and the cache write at the end)
3. the async flow as a SEPARATE numbered sequence (user clicks/purchases streaming into the behavior event store, catalog updates rebuilding the inverted index, and offline model training feeding new ranking models), explicitly marked "async - different color in the diagram"
4. one line per component: what shape to draw it as in Excalidraw and a short label (e.g. "rectangle: Ranking Service - scores candidates on relevance, purchase probability, price, reviews" / "cylinder: Inverted Product Index - term -> product postings for fast retrieval")
5. a one-line note on what NOT to draw as a core box: auth, logging, analytics dashboards, payments - these go in as small supporting blocks off to the side only

Keep it to ONE search query's journey, not the whole Amazon platform.
```

---

## 3. linkedin post

```
how does amazon rank your search results in like 300 milliseconds

you type "wireless earbuds" and get a full ranked page plus a couple sponsored ones up top. that page isnt sitting there waiting for you. its built on the spot

first your query gets cleaned up. spell corrected, intent figured out, synonyms expanded so "earbuds" also catches "earphones". then retrieval pulls a candidate set from a giant inverted index, tens of thousands of matching products. this first pass is greedy on purpose, it wants recall not precision. cast a wide cheap net

then ranking takes over. a light model trims the pile, then a heavy ml model scores whats left on relevance, price, reviews, delivery speed, and your own signals. past purchases, what youve been browsing, prime status. thats the personalization layer

meanwhile a separate ads auction picks sponsored products and slots them in at fixed positions. not just highest bid wins, its blended with relevance so the page doesnt feel like a billboard

the whole thing ends in a cache so the next person searching the same words skips most of the work

the fun tension is personalization vs caching. the more personal the page, the less you can reuse it. so you cache the expensive shared part and reorder lightly per user on top

mapped the full flow as an hld, attached below
```

---

## 4. twitter / x post

```
you type "wireless earbuds" on amazon and get a ranked page in 300ms

its not one search. its a pipeline. clean the query, pull a wide cheap candidate set for recall, then a heavy ml model reranks for relevance + your history, then an ad auction slots sponsored in, then cache it

hld attached
```
