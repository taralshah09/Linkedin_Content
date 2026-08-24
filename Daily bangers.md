# Daily Bangers: Top-Tier Backend, Infra & Agentic AI Reading List

---

## 🏢 Company Engineering Blogs — Distributed Systems & Data

| Post/Series | Company | Why Read | Concept It Covers (in production, not theory) |
|-------|---|----------|-----------|
| Designing Cluster Schedulers for Internet-Scale Services / TrueTime & clocks posts | Google Cloud Blog | How Google actually reasons about ordering and clock skew in prod. | Logical clocks / event ordering |
| Colossus: The Evolution of Google's File System | Google Cloud Blog | GFS's production successor — what changed and why at scale. | Distributed file storage |
| How Google Invented MapReduce (& why they moved past it) | Google Cloud Blog | Where the batch-processing model came from and where it broke down. | Large-scale data processing |
| Cloud Bigtable Under the Hood | Google Cloud Blog | How a column-family store is actually operated and tuned. | Wide-column storage |
| Amazon DynamoDB: A Scalable, Predictably Performant, Fully Managed NoSQL Database | AWS Database Blog | Dynamo's ideas, rebuilt as a real managed product with real trade-offs. | Eventual consistency, partitioning |
| Consensus in the Wild: How Consul/Raft Handles Leader Election | HashiCorp Blog | Raft, but as shipped infra you can go read the code for. | Consensus |
| Living Without Atomic Clocks | CockroachDB Blog | How a real distributed SQL database gets consistency without TrueTime hardware. | Distributed transactions, CAP trade-offs |
| Distributed Tracing at Uber Engineering | Uber Engineering Blog | Why they needed tracing and how Jaeger came out of it. | Distributed tracing |
| Every Company Should Build Streaming Data Pipelines (& follow-ups) | Confluent Blog (Jay Kreps) | The "Log" idea, told by the person who built Kafka and productized it. | Log-structured architecture |
| How Kafka Powers Real-Time Systems at Scale | Confluent / LinkedIn Engineering Blog | Kafka in production: partitions, consumer groups, ops reality. | Log-based messaging |
| Spanner, TrueTime and the CAP Theorem | Google Cloud Blog | How physical clocks became a product feature, explained for engineers. | Global consistency |
| Amazon Aurora Under the Hood (series) | AWS Database Blog | Log-as-the-database, storage/compute separation, real numbers. | Cloud-native relational DBs |
| Deterministic Transactions at Scale | CockroachDB / YugabyteDB Engineering Blogs | Practical takes on deterministic execution for distributed transactions. | Deterministic databases |

## 🤖 Company Engineering Blogs — Agentic AI & LLM Systems

| Post/Series | Company | Why Read | Concept It Covers |
|-------|---|----------|-----------|
| Building Effective Agents | Anthropic | **MUST READ**. Grounded practitioner guide. Workflows vs agents, when NOT to build. | Agent architecture, production patterns |
| How We Built Our Multi-Agent Research System | Anthropic Engineering Blog | Real orchestration trade-offs from a shipped agent product. | Multi-agent orchestration |
| Function Calling and Tool Use in Production | OpenAI Engineering Blog | Tool use as a shipped API feature, not a paper concept. | Tool use / function calling |
| Building ReAct-Style Agents with LangChain | LangChain Blog | The reasoning-loop pattern, implemented and debugged in the open. | Reason + act loops |
| Prompt Engineering for Reliable Outputs | OpenAI / Anthropic Docs & Blogs | Chain-of-thought and structured prompting as applied technique. | Reasoning prompts |
| Retrieval-Augmented Generation in Production: Lessons from Scaling | Pinecone / Weaviate Engineering Blogs | RAG as a system you operate — chunking, re-ranking, freshness — not just an idea. | RAG pipelines |
| Self-Critique and Iterative Agent Loops | LangChain / Anthropic Blogs | Reflection and retry patterns as they show up in shipped agents. | Self-correction loops |
| Building AI Agents That Actually Ship | Vercel / Replit Engineering Blogs | What breaks when agent demos meet real users. | Agent reliability, guardrails |

---

## 🏢 More Engineering Blogs (Archive Worth Reading)

| Company/Author | Focus Areas | Why Follow | Key Series/Posts |
|---|---|---|---|
| **Uber Engineering** | Distributed systems, indexing, orchestration | H3 spatial indexing, Schemaless, Ringpop, Cadence (→ Temporal) | Cadence workflow engine thread |
| **Netflix TechBlog** | Resilience, chaos engineering, scale | Hystrix, resilience philosophy, cloud-native patterns | Chaos engineering, Hystrix patterns |
| **Cloudflare Blog** | Networking, DDoS, edge compute, performance | Best writing on networking anywhere. Masterclass post-mortems. | Network deep-dives, incident post-mortems |
| **Discord Engineering** | Scale, database architecture, Rust | "How Discord stores trillions of messages," ScyllaDB migrations | Message storage at scale |
| **Stripe Engineering** | API design, payments, idempotency | Idempotency, API design, Increment magazine (archived) | Increment magazine archives |
| **Dropbox Tech Blog** | Storage, infrastructure, scale | Magic Pocket (S3 migration) series is classic | Magic Pocket series |
| **Meta Engineering** | Graph databases, key-value stores, scale | TAO (social graph), RocksDB, petabyte-scale systems | TAO, RocksDB posts |
| **Slack Engineering** | Real-time, performance, scale | Infrastructure at massive scale. Practical learnings. | Performance optimization posts |
| **Figma Engineering** | Multiplayer, CRDT, collaboration | Multiplayer architecture, LiveGraph, CRDT patterns | Multiplayer & CRDT posts |
| **AWS Builders' Library** | Operational best practices (canonical) | Timeouts, retries with jitter, load shedding. Amazon distilled. | Timeout/retry/load-shed trio |

---

## 👤 Individual Writers (The Real Signal)

| Author | Website/Blog | Specialization | Why Follow |
|---|---|---|---|
| **Martin Kleppmann** | martin.kleppmann.com | Data systems, distributed systems | Author of *Designing Data-Intensive Applications*. If you read one book, read DDIA. |
| **Marc Brooker** | brooker.co.za | Distributed systems, clocks, retries | Deep, correct, readable. AWS perspective but universally applicable. |
| **Brendan Gregg** | brendangregg.com | Performance, observability, flame graphs | The performance reference. Flame graphs, profiling, tracing. |
| **Aphyr (Kyle Kingsbury)** | aphyr.com | Distributed database testing, consistency | Jepsen series. Adversarial testing of databases. Brutal and educational. |
| **Dan Luu** | danluu.com | Hardware, latency, industry practice | Contrarian, data-driven. Deep dives into latency and system design. |
| **Murat Demirbas** | muratbuffalo.blogspot.com | Paper reviews, distributed systems | Excellent companion to reading papers. Reviews of Paxos, Raft, Spanner, etc. |

---

## ⭐ Top 5 Must-Read (If You're Short on Time)

| # | Title | Author | Time to Read | Why It's #1 |
|---|---|---|---|---|
| 1 | **Designing Data-Intensive Applications (DDIA)** | Martin Kleppmann | Book (~600 pages) | The syllabus. Covers everything: replication, partitioning, consensus, transactions, streams. |
| 2 | **Living Without Atomic Clocks** | CockroachDB Blog | ~15 min read | Same "ordering of events" foundation, shown as a real production trade-off instead of theory. |
| 3 | **The Log: What every software engineer should know about real-time data's unifying abstraction** | Jay Kreps | ~20 min read | Mental model that shaped Kafka, event systems, and modern data architecture. |
| 4 | **AWS Builders' Library** (Timeouts, Retries, Load Shedding) | Amazon | ~30 min total | Practical, operational. The patterns that keep systems alive. |
| 5 | **Building Effective Agents** | Anthropic | ~15 min read | Modern practitioner guide. Workflows vs agents. When NOT to build an agent. |

---

## 📖 How to Use This List

- **Start with Top 5** if you're short on time (2-3 weeks of reading)
- **Layer in company blog series** next (distributed systems first, then agentic AI) — they show the concept as it's actually operated, not just proven
- **Follow the blogs** as a rotation—new posts appear regularly
- **Use Murat's blog** as a companion for the historical/theoretical context behind a pattern, when you want it
- **Reference DDIA** constantly; it's a textbook, not a novel

---

**Last Updated**: 2026-08-17
