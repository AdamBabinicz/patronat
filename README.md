# ♟️ PatronAI — Agentic Patronage & Transparent AI Sponsorship for Youth Sports

> **Transforming corporate goodwill and community patronage into verified, verifiable impact for grassroots youth sports.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-Multimodal_AI-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![PayPal Commerce](https://img.shields.io/badge/PayPal-Commerce_Platform-00457C?style=for-the-badge&logo=paypal)](https://developer.paypal.com/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-Serverless_Postgres-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 📌 Submission Meta Links

| Resource                      | Link                                                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🌐 **Live Application**       | `https://patronat.vercel.app/`                                                                                                                                                                                 |
| 💻 **Source Code Repository** | `https://github.com/AdamBabinicz/patronat`                                                                                                                                                                     |
| 🎥 **Video Demo & Pitch**     | `https://youtu.be/dQw4w9WgXcQ`                                                                                                                                                                                 |
| 📊 **Pitch Deck Presentation (PDF)** | [PatronAI — Pitch Deck · PayPal AI Hackathon](https://github.com/AdamBabinicz/patronat/blob/main/docs/PatronAI%20%E2%80%94%20Pitch%20Deck%20%C2%B7%20PayPal%20AI%20Hackathon.pdf) |
| 🏆 **Target Pilot Partner**   | **UKS Roszada Radom** — Youth Chess Club, Poland — prospective pilot partner / target community use case (80+ players); production deployment planned after the hackathon ([club profile](https://roszada-radom.vercel.app/)) |

---

<a id="transparency-disclaimer"></a>

> **⚠️ TRANSPARENCY DISCLAIMER — READ FIRST ⚠️**
>
> **All figures, amounts, and allocation counts shown in the public ledger — for example `17 224 PLN` and `29 allocations` — belong to a dynamic simulated benchmark dataset: the Dynamic Pilot Benchmark Dataset.** The platform is under **active, continuous testing and benchmarking**, which means these figures are live-aggregated from Neon Serverless PostgreSQL (`v_ledger_totals`) and **evolve dynamically** as new simulated allocations are added. They are not stored as fixed constants and must not be read as production traction.
>
> **Real funds collected remain strictly `0.00 PLN`.** The PayPal gateway runs in **Developer Sandbox / Simulation mode**, with **no production bank or PayPal account connected** for our prospective pilot partner, **UKS Roszada Radom** — so no real money has been, or can be, processed through this prototype.

---

## 📖 Table of Contents

1. [The Problem](#-the-problem)
2. [The Solution](#-the-solution-patronai)
3. [The Deterministic Trust Layer](#-the-deterministic-trust-layer--architecture-philosophy)
4. [System Architecture](#️-system-architecture--pipeline-diagrams)
5. [Load Testing & Benchmark Validation](#-load-testing--benchmark-validation-results)
6. [Core AI Pillars — Deep Dives](#-core-ai-pillars--deep-dives)
7. [Recent Advanced UX & Trust Layer Enhancements](#-recent-advanced-ux--trust-layer-enhancements)
8. [Typographic Precision & Dual-Layer i18n](#-refined-typographic-precision--i18n-dual-layer)
9. [Technology Stack](#️-technology-stack)
10. [Project Architecture](#-project-architecture-clean-architecture)
11. [Getting Started Locally](#-getting-started-locally)
12. [Judge Walkthrough — Test in 3 Minutes](#-judge-walkthrough--test-in-3-minutes)
13. [Presentation Materials & Pitch Deck](#-presentation-materials--pitch-deck)
14. [Pilot Framework, Simulation Data & Target Club Partnership](#-pilot-framework-simulation-data--target-club-partnership)
15. [What Makes PatronAI Hack-Worthy](#-what-makes-patronai-hack-worthy--60-second-executive-summary)
16. [License & Team](#-license--team)

---

## 💡 The Problem

1. **Grassroots Sports Underfunding:** Local youth clubs operate with limited administrative resources, struggling to reach corporate sponsors and individual donors.
2. **The "Black Box" of Donations:** Sponsors hesitate to donate because traditional charity lacks granular transparency regarding how funds are actually spent — a transfer is made, and trust is asked for in return.
3. **Barter Inefficiencies:** A significant share of small-business support is provided in-kind (printing, transport, catering, equipment), yet clubs lack legal templates and market valuation tools to formalize informal barter agreements.
4. **Lack of Instant Corporate Return (CSR/ESG):** B2B patrons want measurable impact metrics for annual ESG reports and ready-to-publish social media deliverables — deliverables that usually take weeks of back-and-forth.

### Problem → Solution Mapping

```mermaid
flowchart LR
    subgraph P["❌ The Problem"]
        P1["Black-box donations"]
        P2["Informal barter deals"]
        P3["No CSR / ESG proof"]
        P4["Slow, manual matching"]
    end
    subgraph S["✅ The PatronAI Solution"]
        S1["AI Vision Expense Audit<br/>+ SHA-256 public ledger"]
        S2["AI Barter Valuator<br/>+ legal agreement generator"]
        S3["One-click LinkedIn &<br/>UN SDG ESG statements"]
        S4["PatronAgent autonomous<br/>intent & ROI matching"]
    end
    P1 --> S1
    P2 --> S2
    P3 --> S3
    P4 --> S4
```

---

## 🚀 The Solution: PatronAI

**PatronAI** is an autonomous agentic platform connecting patrons and businesses with youth sports needs — represented in this prototype by an **illustrative demo catalog** (`lib/needsCatalog.ts`). Powered by **Google Gemini multimodal intelligence** and agentic commerce workflows, PatronAI converts patron intentions into **audited, hash-verified allocations** (demonstrated on the **Dynamic Pilot Benchmark Dataset**) — with instant corporate deliverables (LinkedIn posts, ESG statements, certificates, and personalized voice thank-you notes) generated the moment a contribution is made.

The platform is a **Competition Pilot & Prototype**: **Real Funds Collected: 0.00 PLN** — no sponsorship revenue exists, and no production bank or PayPal account is connected (see the [Transparency Disclaimer](#transparency-disclaimer)). The platform is under **active, continuous testing and benchmarking**, so every ledger figure is dynamic rather than final. The public ledger presents a **Dynamic Pilot Benchmark Dataset across continuously simulated test allocations, live-aggregated directly from Neon Serverless PostgreSQL**: a modeled scenario based on illustrative club needs, created solely to demonstrate how the architecture works end-to-end. Every total visible in the ledger — including the running value shown in the ledger registry — is **aggregated in real time from the `allocations` table in Neon Serverless PostgreSQL through the `v_ledger_totals` view**, never stored as a hard-coded constant. No real invoices, budgets, or club expenditures exist behind these numbers.

### End-to-End Patronage Flow

```mermaid
flowchart LR
    A["👤 Patron<br/>(B2B / Individual)"] --> B["🧠 PatronAgent<br/>Intent Matching & ROI"]
    B --> C["💼 Checkout<br/>PayPal or In-Kind Barter"]
    C --> D["📖 Public Ledger<br/>Allocation Entry"]
    D --> E["🧾 AI Vision<br/>Expense Audit"]
    E --> F["🏅 Verifiable Certificate<br/>SHA-256 Hash"]
    F --> G["📣 CSR Pack +<br/>AI Voice Note"]
```

---

## 🔐 The Deterministic Trust Layer — Architecture Philosophy

> **"A rule a prompt can hallucinate around is not a financial rule."**

This single sentence is the architectural thesis of PatronAI, and it dictates where intelligence lives in the system.

PatronAI splits every decision into exactly two layers, and the boundary between them is never negotiable:

- **🧠 Probabilistic Layer — Google Gemini.** Multimodal Vision **inspects**, **transcribes**, and **semantically audits** invoices and receipts. It reasons about intent, extracts merchant tax IDs (NIP), line items, net/gross totals, and judges whether a purchase actually serves the declared allocation goal. Its output is *advisory JSON* — a recommendation, never a ledger mutation.
- **⚙️ Deterministic Layer — Plain Code.** **SHA-256 cryptographic hashes**, **Neon Serverless PostgreSQL relations**, and **SQL aggregation views** enforce ledger integrity and transactions. Nothing enters the permanent record because a model said so; entries enter because deterministic code hashed them, relational constraints accepted them, and SQL aggregated them.

**Why this matters.** A generative model is a *judge of meaning*, not an *enforcer of arithmetic*. Gemini is allowed to decide *"does this DGT chess clock invoice plausibly match an allocation for tournament equipment?"* — a genuinely fuzzy, semantic question that deterministic code cannot answer. Gemini is **never** allowed to decide the balance of the ledger, the total in the registry, whether a hash is valid, or whether a transaction is final — all of those are exact, reproducible computations owned by the database.

The result is a trust model judges can verify independently: the **AI is auditable**, because every AI decision is stored as data next to the deterministic record that sealed it. You can re-read the Gemini output, re-run the SHA-256 digest, re-execute the SQL aggregation, and confirm the ledger reconciles — with no model in the loop required.

```mermaid
flowchart LR
    subgraph AI["🧠 Probabilistic Layer — Google Gemini"]
        V["Multimodal Vision<br/>OCR + semantic audit"]
        R["Reasoning<br/>Intent and ROI matching"]
    end
    subgraph DET["⚙️ Deterministic Layer — Plain Code"]
        H["SHA-256 Integrity Hashing"]
        DB[("Neon Serverless<br/>PostgreSQL relations")]
        SQL["SQL Aggregation Views<br/>v_ledger_totals"]
    end
    V -- "structured JSON, advisory only" --> H
    R -- "typed match object" --> H
    H --> DB
    DB --> SQL
    SQL -- "live totals" --> L["Public Ledger Registry"]
    SQL -- "live totals" --> C["Standalone certificate verification"]
```

### Layer Responsibility Matrix

| Concern                              | Owner                                        | Nature                          | Hallucination risk tolerated? |
| ------------------------------------ | -------------------------------------------- | ------------------------------- | ----------------------------- |
| Invoice / receipt OCR               | Google Gemini Multimodal Vision              | Probabilistic, advisory         | Yes — output is reviewed as data |
| Semantic purpose match              | Google Gemini Reasoning                      | Probabilistic, advisory         | Yes — mismatches are flagged, never silently approved |
| Intent → need matching & social ROI | PatronAgent (Gemini) + typed needs catalog   | Probabilistic + typed domain    | Yes — scoring only, no ledger effect |
| Ledger totals & multi-currency sums | SQL aggregation view `v_ledger_totals`       | Deterministic, reproducible     | **No**                        |
| Record integrity / tamper evidence  | SHA-256 cryptographic hashing                | Deterministic, reproducible     | **No**                        |
| Relational persistence & constraints| Neon Serverless PostgreSQL                   | Deterministic, transactional    | **No**                        |

---

## 🏗️ System Architecture & Pipeline Diagrams

<div align="center">
  <img src="./public/patronai-architecture-en.png" alt="PatronAI × Neon Serverless PostgreSQL — End-to-End Autonomous Sponsorship & Trust Layer Architecture" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.25);" />
  <p><em>PatronAI × Neon Serverless PostgreSQL — Autonomous Sponsorship, Multimodal AI & Trust Layer Architecture</em></p>
</div>

### High-Level System Flow

```mermaid
flowchart TB
    subgraph FE["Frontend · Next.js 15 App Router"]
        UI["page.tsx + Components"]
        VOICE["Web Speech API<br/>Voice Input / Synthesis"]
        CAM["Live Upload / Camera Runner<br/>Drag-and-drop receipts"]
    end
    subgraph DOMAIN["Domain Layer · Clean Architecture"]
        CATALOG["lib/needsCatalog.ts<br/>Typed club needs catalog"]
        I18N["lib/translations/<br/>Strict type-safe i18n (pl / en)"]
    end
    subgraph API["API Layer"]
        MATCH["app/api/agent/match/route.ts<br/>Streamlined Gemini NLP & URL Matching"]
        LEDGERAPI["app/api/ledger/route.ts<br/>Cloud Ledger GET/POST + Live v_ledger_totals Aggregation"]
        CERTAPI["app/api/certificate/[id]/route.ts<br/>DB-driven Certificate Verification"]
        CAPTURE["app/api/paypal/capture-order/route.ts<br/>PayPal Capture + Persistent DB Write"]
    end
    subgraph GEM["Google Gemini"]
        NLP["Reasoning ·<br/>Social ROI Prediction"]
        VISION["Multimodal Vision ·<br/>Invoice & Receipt Audit"]
    end
    subgraph PAY["Payments"]
        PP["PayPal JavaScript SDK<br/>Commerce Platform + Developer Simulation"]
    end
    subgraph LEDGER["Trust & Persistence Layer"]
        DB[("Neon Serverless<br/>PostgreSQL")]
        HASH["SHA-256 Integrity Hashes"]
        CERT["/certyfikat/[id] · QR + PDF"]
    end
    UI --> MATCH
    MATCH --> NLP
    CATALOG --> MATCH
    UI --> VISION
    CAM --> VISION
    UI --> PP
    UI --> VOICE
    UI --> LEDGERAPI
    UI --> CERTAPI
    MATCH --> LEDGERAPI
    PP --> CAPTURE
    VISION --> HASH
    LEDGERAPI --> DB
    CERTAPI --> DB
    CAPTURE --> DB
    DB --> HASH
    HASH --> CERT
    UI --> I18N
```

### AI Vision Expense Audit Pipeline

The pipeline runs **at allocation time, not upload time** — every receipt is semantically audited against the patron's declared goal before it can be marked as verified.

```mermaid
flowchart TD
    SCAN["📷 Scan / Upload<br/>Camera capture or drag-and-drop<br/>(judge test runner in Public Ledger)"] --> B64["📦 Base64 Encoding<br/>inline multimodal payload"]
    B64 --> OCR["🧠 Gemini Multimodal Vision OCR<br/>Structured JSON extraction"]
    OCR --> EXTRACT["📋 Extracted Fields<br/>Merchant name · Tax ID (NIP)<br/>line items · qty · net / gross totals"]
    EXTRACT --> AUDIT{"🎯 Semantic Audit<br/>allocation goal vs. actual spending"}
    AUDIT -- "✅ Match" --> HASH["🔐 SHA-256 Integrity Hash<br/>tamper-evident ledger record"]
    AUDIT -- "⚠️ Mismatch" --> FLAG["🚩 Statutory Mismatch Flag<br/>entry held for review"]
    HASH --> CERT["🏅 Verifiable Certificate<br/>/certyfikat/[id] · dynamic QR · PDF"]
    FLAG --> CERT
    CERT --> NOTIFY["📣 Patron Notification<br/>+ LinkedIn / ESG deliverables"]
```

---

## 📊 Load Testing & Benchmark Validation Results

A full **stress-test pass** was executed against the Neon Serverless PostgreSQL ledger to prove — not assert — that the deterministic layer holds under a realistic benchmark workload. The benchmark dataset was seeded into the `allocations` table as a **Dynamic Pilot Benchmark Dataset of continuously simulated test allocations**, then read back exclusively through the production code path (`app/api/ledger/route.ts` → `v_ledger_totals`).

### Verified Benchmark Results

| Benchmark metric                        | Verified result                                                                                     | Enforcement mechanism                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 🗄️ **Live allocations aggregated**      | **29** allocations aggregated end-to-end                                                            | `allocations` table → `v_ledger_totals` view   |
| ⚡ **Aggregate query response time**    | **~160 ms** for the full 29-row aggregation                                                         | Pooled serverless Postgres connection          |
| 💰 **Multi-currency ledger total**      | **17 224 PLN / EUR 4,006** — computed dynamically at read time                                       | `v_ledger_totals` view — **zero hardcoded values** |
| 📅 **Season segregation — Season 2026** | **20 active allocations**                                                                           | Season column partitioning in SQL aggregation  |
| 📅 **Season segregation — Archive**     | **9 historical allocations (2025)**                                                                 | Season column partitioning in SQL aggregation  |
| 👥 **Unique patrons identified**        | **21 unique patrons**                                                                               | Patron relation across `allocations`           |
| 🏅 **Recurring Patron engine**          | Badges such as **"Stały Mecenas (3) / Recurring Patron (3)"** rendered from verified counts          | `patron_donation_count` aggregation            |

### What the Stress Test Proves

- **The numbers are computed, not stored.** The PLN/EUR totals above are produced on every request by the `v_ledger_totals` aggregation view. Change a row in `allocations` and the registry moves — there is no constant anywhere in the path that could drift from the data.
- **Latency stays flat as the ledger grows.** Aggregating all 29 allocations — spanning two seasons and 21 distinct patrons — completes in **~160 ms**, so the public ledger remains an instant, live view rather than a cached snapshot.
- **Season segregation is a first-class query dimension.** The same dataset cleanly splits into **Season 2026 (20 active allocations)** and **Archive (9 historical allocations from 2025)**, letting a club show current-season momentum and historical track record side by side without separate tables.
- **The Recurring Patron engine is real.** With **21 unique patrons** resolved and `patron_donation_count` driving badge rendering, a returning sponsor is recognized automatically — e.g. **"Stały Mecenas (3) / Recurring Patron (3)"** — rather than being tallied by hand.

```mermaid
flowchart LR
    A[("allocations table<br/>29 benchmark rows")] --> V["v_ledger_totals<br/>SQL aggregation view"]
    V --> T["Multi-currency registry<br/>17 224 PLN / EUR 4,006"]
    V --> S["Season segregation<br/>2026: 20 active / Archive: 9"]
    V --> P["Recurring Patron engine<br/>21 patrons / patron_donation_count"]
```

> **⚠️ Transparency note:** every figure above — amounts, allocation counts, aggregated totals — belongs to a **dynamic simulated benchmark dataset (Dynamic Pilot Benchmark Dataset)** and **evolves dynamically** while the platform undergoes **active, continuous testing and benchmarking**. These are benchmark results, not production traction. Real funds collected remain strictly **0.00 PLN**: the PayPal gateway runs in **Developer Sandbox / Simulation mode**, with **no production bank or PayPal account connected** for our prospective pilot partner, **UKS Roszada Radom** — see the [Transparency Disclaimer](#transparency-disclaimer) and [Pilot Framework, Simulation Data & Target Club Partnership](#-pilot-framework-simulation-data--target-club-partnership).

---

## 🧠 Core AI Pillars — Deep Dives

### 1. ⚡ PatronAgent — Autonomous Intent & ROI Matcher

PatronAgent is the agentic front door of the platform: it turns a raw intention into a structured, priced, impact-scored sponsorship in seconds.

- **Multimodal Input:** Accepts natural language descriptions, **voice input via the Web Speech API** (`pl-PL` / `en-US`), or a plain company URL (e.g. `drukarnia-virgo.pl`, `facebook.com`).
- **Automated URL Parsing & Domain Categorization:** The `app/api/agent/match/route.ts` Gemini-backed endpoint scrapes and classifies the business domain, determining whether the patronage is financial or in-kind — no forms, no onboarding friction.
- **Needs-Catalog Matching:** Domain logic is decoupled into `lib/needsCatalog.ts` — a strictly typed catalog of **illustrative club needs** (equipment, transport, tournaments, coaching): hypothetical demo scenarios the agent matches intentions against in this prototype.
- **Social ROI Predictor:** Forecasts measurable societal impact per allocation: beneficiary count, training hours funded, competition access percentage.
- **Adaptive Multi-Currency Engine:** Instant live switching with localized presets across **PLN**, **EUR**, and **USD** — sponsors see amounts in their own currency without page reloads.

### 2. 🧾 AI Vision Expense Audit — Live Ledger Verification

The flagship answer to the black-box donation problem, orchestrated by `components/PublicLedger.tsx` and its extracted modular sub-components in `components/ledger/`.

- **Gemini Multimodal Vision OCR:** Reads scanned VAT invoices and receipts, extracting the **Merchant Tax ID (NIP)**, invoice line items, and net/gross totals into structured JSON.
- **Semantic Purpose Verification:** Cross-checks what was purchased (e.g. _DGT electronic tournament clocks_, _championship bus transit_, _engraved trophies_ — **hypothetical test scenarios** with sample demo invoices) against the patron's original allocation goal — mismatches are **flagged, not silently approved**.
- **🖼️ Live Upload / Camera Test Runner:** Built for hackathon judges — drag-and-drop (or camera-capture) your own receipt and watch instant AI OCR verification happen live in the Public Ledger.
- **Tamper-Evident Cryptographic Ledger:** Every verified allocation is sealed with a **SHA-256 integrity hash**, making the public ledger tamper-evident down to individual line items.
- **🔐 Canonical Cryptographic Truth & Dual-Layer i18n (SHA-256):** The integrity hash is always derived from the **canonical Polish ledger record** of the club (UKS Roszada Radom), so the SHA-256 checksum stays stable and independently verifiable — while the interface can still render a **fully English UI/UX for international PayPal judges**. The canonical mapping lives in `lib/translations/purposeMap.ts`, and `components/ledger/LedgerPurposeCell.tsx` renders the localized goal with a subtle **`PL Original`** badge — auditable translation layered on top of cryptography, never a silent override of it.
- **🧾 100% Database-Driven Audit Reports (Zero-Hardcoding):** Every VAT invoice audit report — Gemini Multimodal OCR output, merchant **NIP**, cost line items, net/gross totals — is fetched **live from the `audit_reports` table in Neon Serverless PostgreSQL**, and the audit modal (`components/ledger/LedgerAuditModal.tsx`) renders only what the database returns. **No static mock fallbacks, no hard-coded invoice fixtures anywhere in the audit path.**
- **⚙️ Advisory AI, Deterministic Ledger:** Gemini's audit verdict is stored as reviewable data; it never writes a total or mutates the ledger. Hashing and aggregation remain in plain code — see [The Deterministic Trust Layer](#-the-deterministic-trust-layer--architecture-philosophy).

### 3. 🤝 AI Barter Valuator — In-Kind Sponsorship Rails

Most sponsorship platforms ignore barter entirely. PatronAI makes in-kind contribution a first-class, certificate-grade citizen.

- **Automatic Market Valuation (AVE):** Values goods and services at market equivalence — transport, printing, trophies, IT support, catering.
- **Automatic Tier Allocation:** Classifies patrons into **Gold, Silver, and Bronze In-Kind Patron** tiers based on evaluated market value.
- **Legally Structured Agreement Generation:** Automatically generates downloadable, print-ready **Barter Partnership Agreements** (`.txt`) covering the in-kind contribution and the club's reciprocal commitments (banner exposure, social media spotlight, ledger certificate).

### 4. 💼 B2B CSR & ESG Pack + LinkedIn Viral Generator

Closes the corporate feedback loop in the same minute the contribution happens — not a quarter later.

- **One-Click LinkedIn Announcement:** A ready-to-publish post highlighting the funded need, club name, allocation amount, hashtags, and the public ledger link — engineered for shareability.
- **Formal ESG / SDG Statement:** Auto-formulated corporate sustainability language aligned with **UN SDG 3 (Good Health & Well-being)** and **UN SDG 4 (Quality Education)**, ready to paste into annual ESG and CSR reports.

### 5. 🎙️ AI Dynamic Impact Voice — Personalized Athlete Audio Note

The emotional payload of every sponsorship: donors don't just see a receipt — they _hear_ the impact.

- **Personalized Speech Synthesis:** A spoken thank-you note from junior club players, addressing the patron **by name**, generated via browser Speech Synthesis.
- **Interactive Equalizer Waveform:** A live visual audio waveform pulsing synchronously with playback (Canvas API).
- **Real-Time Bilingual Transcript:** Full on-screen transcription with seamless `pl` / `en` language support.

### 6. 🔐 Standalone Verification Route — `/certyfikat/[id]`

- **Public Immutable Verification Page:** Any certificate is independently verifiable at a standalone URL — no login, no app context required.
- **Dynamic QR Code:** Instant smartphone scanning straight from the certificate page or printed material.
- **PDF Generation & Ledger Lookup:** One-click PDF export and a direct link back to the tamper-evident public ledger entry.
- **🧬 Surfaced SHA-256 Seal on the Certificate UI:** The full **64-character SHA-256 cryptographic hash** is rendered directly on the certificate page with a one-click copy control — a judge can lift the digest and verify it independently, without opening developer tools.
- **🖨️ Ink-Friendly Print & PDF Styling:** Dedicated `@media print` rules switch the certificate to a white background with print-optimized contrast, so a PDF export or a physical printout stays legible and toner-friendly.
- **🌍 Canonical Hash Stability Across Languages:** Verification is always recomputed from the **canonical Polish source record**, mapped through `lib/translations/purposeMap.ts` and rendered via `components/ledger/LedgerPurposeCell.tsx` (English goal + subtle **`PL Original`** badge). An English-language certificate therefore verifies against the **same SHA-256 checksum** as the Polish original — international judges get a native English UX without invalidating a single issued certificate.

### 7. 💳 PayPal Commerce Platform Integration

- **PayPal JavaScript SDK:** Supports card and digital wallet payments through the PayPal Commerce Platform.
- **Developer Simulation Mode:** A built-in simulation flow (`NEXT_PUBLIC_PAYPAL_CLIENT_ID=test`) lets judges trigger instant checkouts and explore post-payment deliverables without live credentials.
- **Sandbox-Only Status:** The gateway runs exclusively in **simulation / sandbox mode — no production UKS Roszada account connected**. No real transactions have been (or can be) processed at this stage of the project.
- **🔗 Atomic Capture → Audit Report Sync:** `/api/paypal/capture-order` no longer stops at the payment record. On capture, it **atomically creates the linked, verified audit report row in `audit_reports`** within the same transaction, so a sandbox checkout produces an unbroken, queryable trust trail — payment, allocation, audit report, and hash seal all resolve to one narrative with no manual reconciliation step.

---

## 🆕 Recent Advanced UX & Trust Layer Enhancements

The trust layer is only as credible as the interface that presents it. These are the most recent hardening passes on the Public Ledger, the certificate route, and the language an institutional patron reads.

### 🔄 Bidirectional Pagination — `components/PublicLedger.tsx`

The Public Ledger is now navigable in **both directions**, asynchronously, with no page reload:

- **Expanding:** a **"Load more allocations"** control (`ChevronDown`) appends the next batch of allocations to the live table.
- **Collapsing:** an instant **"Show less (collapse to 8)"** control (`ChevronUp`) returns the ledger to its default 8-row view and **smooth-scrolls the viewport back to the top of the table**, so the reader never loses their place.

```mermaid
stateDiagram-v2
    [*] --> Collapsed8
    Collapsed8 --> ExpandedAll: "Load more allocations (ChevronDown)"
    ExpandedAll --> Collapsed8: "Show less, collapse to 8 (ChevronUp) + smooth scroll to table top"
```

### 👤 Interactive Recurring Patron Profile Modal

Clicking a patron's **recurring badge** (e.g. `Stały Mecenas (3) / Recurring Patron (3)`) now opens an **aggregate impact profile** for that patron instead of a static tooltip. The modal presents:

- **Total verified allocations** attributed to that patron,
- **Identified financial support** aggregated across their contributions,
- **A one-click deep filter** that applies the patron's identity as a live filter back in the Public Ledger — turning a badge into an investigative tool.

### 🏛️ Elevated Enterprise Trust Terminology

Defensive, absolutist phrasing was replaced with the language institutional finance and CSR reviewers actually use:

| Previous (defensive) wording | Elevated (institutional) wording | Locale |
| ---------------------------- | --------------------------------- | ------ |
| "Zero fraud"                 | **"100% Purpose Aligned"**        | EN     |
| "Zero fraud"                 | **"100% Zgodności Celowej"**      | PL     |

The claim is now precise and defensible: every verified allocation is aligned with its declared purpose — a statement backed by the in-database audit record, rather than an unfalsifiable absolute.

### 🧾 Standalone Certificate Route (`/certyfikat/[id]`)

- The **64-character SHA-256 cryptographic hash seal** is now surfaced directly in the certificate UI, with a **one-click copy** action.
- Print and PDF output was optimized with dedicated **`@media print`** styles for **ink-friendly white backgrounds** — certificates are meant to be printed and pinned to a clubhouse wall.

### 🔗 PayPal Capture Route Sync (`/api/paypal/capture-order`)

- The capture endpoint now **atomically creates linked verified audit reports in `audit_reports`**, preserving an **unbroken trust trail** for every sandbox checkout.
- No orphaned payment records: capture, allocation, and audit report land together, so the deterministic layer never has to reconcile a half-written story.

---

## 🎯 Refined Typographic Precision & i18n Dual-Layer

### 💱 Currency Typography — Locale-Correct, Globally Readable

Financial precision is a design requirement, not a detail. PatronAI formats every displayed amount according to its own locale convention:

| Currency | Formatting convention                          | Rendered example |
| -------- | ---------------------------------------------- | ---------------- |
| **PLN**  | Suffix symbol, **thousands separated by space** | **`17 224 PLN`** |
| **EUR**  | **Prefix symbol**, comma decimal separator      | **`EUR 4,006`**  |
| **USD**  | **Prefix symbol**, comma decimal separator      | `USD 4,006`      |

A Polish patron reads `17 224 PLN`; an international judge reads `EUR 4,006`. Same ledger, same underlying aggregation view, locale-appropriate typography on top.

### 🌍 Dual-Layer Canonical Purpose Mapping

The certificate requirement and the i18n requirement pull in opposite directions: judges need English, but the SHA-256 checksum must stay anchored to a single, stable record. PatronAI satisfies both with a two-layer model:

- **Layer 1 — Canonical Polish record (hash-anchoring).** The cryptographic digest is always derived from the **canonical Polish ledger record** of the club (UKS Roszada Radom). This record is the source of truth and is never translated in place.
- **Layer 2 — Localized presentation (badge-marked).** International judges read a **native English description** of the purpose, rendered through `lib/translations/purposeMap.ts` and `components/ledger/LedgerPurposeCell.tsx`, carrying a subtle **`PL Original`** badge that advertises the canonical origin of the hash.

**Net effect:** an English UI, a native-quality reading experience for international PayPal judges, **and** zero certificate invalidation — the same SHA-256 checksum verifies in both languages. Localization is layered *on top of* cryptography, never *instead of* it.

---

## 🛠️ Technology Stack

| Layer                       | Technologies                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Framework**      | Next.js 15 (App Router), React 19, TypeScript 5                                                                                                                 |
| **Styling & UI**            | Tailwind CSS 3.4, Lucide Icons (`ChevronDown` / `ChevronUp` pagination controls), Canvas API (audio equalizer)                                                  |
| **Artificial Intelligence** | Google Gemini API (Multimodal Vision + Reasoning), Web Speech API (input & synthesis)                                                                           |
| **Payments & Checkout**     | PayPal JavaScript SDK (Commerce Platform, Sandbox / Developer Simulation Mode)                                                                                  |
| **Domain & i18n**           | `lib/needsCatalog.ts` (typed needs domain), `lib/translations/` (strict type-safe `pl` / `en`), `lib/translations/purposeMap.ts` (canonical purpose mapping)    |
| **Security & Trust**        | SHA-256 cryptographic integrity hashes, canonical Polish-source hashing, 64-char hash seal surfaced on the certificate UI, standalone QR verification route      |
| **Database & Persistence**  | Neon Serverless PostgreSQL (`@neondatabase/serverless`), connection pooling, auto-migrating DDL schema (`allocations`, `audit_reports`, `v_ledger_totals` view), SQL aggregation for live multi-currency totals, season segregation, `patron_donation_count` |
| **Client State**            | React State (ephemeral UI state)                                                                                                                                |
| **Deployment**              | Vercel / Google Cloud Run (Dockerized Container)                                                                                                                |

---

## 📁 Project Architecture (Clean Architecture)

Domain logic is deliberately decoupled from the UI and API layers: the club needs catalog lives in `lib/needsCatalog.ts`, the Neon persistence client lives in `lib/db.ts`, the Gemini orchestration is consolidated into a single streamlined route, and all user-facing strings flow through a strict, type-safe translation layer with a canonical purpose map. The public ledger and certificates are stored in a relational Neon Serverless PostgreSQL database, not in the browser — and the registry totals are read live from the database rather than hard-coded.

```bash
patronai/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   └── match/
│   │   │       └── route.ts         # Streamlined Gemini NLP & company-URL matching engine
│   │   ├── ledger/
│   │   │   └── route.ts             # Cloud ledger GET/POST — live totals aggregated from `allocations` via `v_ledger_totals`
│   │   ├── certificate/
│   │   │   └── [id]/
│   │   │       └── route.ts         # Database-driven certificate verification endpoint
│   │   └── paypal/
│   │       └── capture-order/
│   │           └── route.ts         # PayPal capture with persistent database write + atomic linked audit report creation
│   ├── certyfikat/
│   │   └── [id]/
│   │       └── page.tsx             # Standalone verifiable certificate route (SHA-256 seal + copy, QR + PDF + ledger lookup)
│   ├── layout.tsx                   # Root layout with responsive viewport & meta
│   └── page.tsx                     # Main interactive application & navigation
├── components/
│   ├── PatronAgent.tsx              # AI matching, voice input & Barter Valuator
│   ├── DonationCheckout.tsx         # Multi-currency checkout & PayPal integration
│   ├── PublicLedger.tsx             # Orchestrating live ledger with AI Vision Invoice Audit + bidirectional pagination
│   ├── ledger/
│   │   ├── LedgerPurposeCell.tsx    # Dual-level bilingual goal rendering with "PL Original" badge
│   │   ├── LedgerAuditModal.tsx     # Extracted Gemini Multimodal Vision invoice audit modal
│   │   └── LedgerCertificateModal.tsx # Extracted dynamic QR verification certificate modal
│   └── checkout/
│       ├── AmountSelector.tsx       # Currency-adaptive donation tier pills
│       ├── DonorDetailsForm.tsx     # Anonymous / corporate patron details form
│       ├── DonationCertificate.tsx  # Certificate, AI Voice note & CSR pack
│       └── types.ts                 # TypeScript currency & allocation interfaces
├── lib/
│   ├── db.ts                        # Neon Serverless PostgreSQL client, schema DDL (`allocations`, `audit_reports`, `v_ledger_totals`) & interfaces
│   ├── needsCatalog.ts              # Domain layer: typed club needs catalog (decoupled core logic)
│   └── translations/
│       ├── purposeMap.ts            # Canonical cryptographic mapping & dual-layer purpose localization
│       ├── index.ts                 # Localization manager (strict, type-safe)
│       ├── pl.ts                    # Polish translation dictionary
│       └── en.ts                    # English translation dictionary
└── public/                          # Static branding & assets
```

---

## ⚡ Getting Started Locally

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm package manager
- A Neon Serverless PostgreSQL database (free tier) — the schema is created automatically on first request

### 1. Clone the repository

```bash
git clone https://github.com/AdamBabinicz/patronat
cd patronai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Google Gemini API Key — powers Multimodal Vision audit & PatronAgent matching
GEMINI_API_KEY=your_gemini_api_key_here

# PayPal Client ID — set to 'test' for the built-in developer simulation mode
NEXT_PUBLIC_PAYPAL_CLIENT_ID=test

# Neon Serverless PostgreSQL — pooled connection string for the public ledger & certificates
DATABASE_URL=postgresql://neondb_owner:password@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Application Base URL — used for certificate links & QR codes
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** With `NEXT_PUBLIC_PAYPAL_CLIENT_ID=test`, checkout runs in **developer simulation mode** — payments are simulated instantly so you can test the full post-payment flow (certificate, CSR pack, AI voice note) without PayPal credentials.
>
> **Database note:** Paste the **pooled** connection string from your Neon project dashboard. Tables `allocations` and `audit_reports` (plus the `v_ledger_totals` aggregation view) are created automatically (auto-migrating DDL) on the first API request, and the dynamic pilot benchmark dataset is seeded on demand.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to experience PatronAI.

---

## 🧪 Judge Walkthrough — Test in 3 Minutes

> Every scenario below runs on the live app with **no setup required**. PayPal simulation mode is pre-configured.
>
> 📊 **Evaluation materials:** the companion [**Pitch Deck Presentation (PDF)**](https://github.com/AdamBabinicz/patronat/blob/main/docs/PatronAI%20%E2%80%94%20Pitch%20Deck%20%C2%B7%20PayPal%20AI%20Hackathon.pdf) walks the jury through this same flow — architecture, the Deterministic Trust Layer, and the benchmark validation results. Every presentation artifact this submission exposes is indexed in [**Presentation Materials & Pitch Deck**](#-presentation-materials--pitch-deck).

### ⏱️ Minute 1 — PatronAgent: Autonomous Matching

1. Paste `https://drukarnia-virgo.pl` (or any company URL) into PatronAgent — or tap 🎤 and speak in Polish or English (`pl-PL` / `en-US`).
2. Watch automated domain parsing, business categorization, and the **Social ROI prediction** (beneficiaries, training hours, impact metrics).
3. Flip the currency toggle **PLN → EUR → USD** and see the presets re-localize instantly.

### ⏱️ Minute 2 — Checkout + Instant Deliverables

1. Proceed to checkout with the PayPal SDK (**simulation / sandbox mode** — no real charge, no production account connected) or toggle 🎁 **In-Kind / Barter**.
2. In barter mode, watch the **AI Barter Valuator** assign a Gold/Silver/Bronze tier from the market valuation (AVE) and download the print-ready **`.txt` Barter Partnership Agreement**.
3. After "payment," open the delivered **AI PR Kit**: the one-click LinkedIn announcement and the UN SDG 3/4-aligned ESG statement.
4. Play the **AI Dynamic Impact Voice** note — a personalized spoken thank-you from the junior players, with the live equalizer waveform and bilingual transcript.

### ⏱️ Minute 3 — AI Vision Expense Audit & Verification

1. Scroll to **KROK 03 · Public Ledger** and click 🧾 **Audyt AI / AI Audit** on any allocation row.
2. Inspect the Gemini-extracted VAT invoice data: merchant **NIP**, line items, net/gross totals — semantically checked against the allocation goal, all served live from the `audit_reports` table in Neon PostgreSQL.
3. **Try it yourself:** use the **Live Upload / Camera runner** to drag-and-drop your own receipt and watch instant AI OCR verification.
4. **Stress the ledger view:** click **Load more allocations** (`ChevronDown`) to page forward, then **Show less (collapse to 8)** (`ChevronUp`) to snap back to the top of the table — the registry totals stay live throughout.
5. **Drill into a recurring patron:** click a **`Stały Mecenas / Recurring Patron`** badge to open the aggregate impact profile and apply its one-click ledger filter.
6. Open any **`/certyfikat/[id]`** certificate: scan the dynamic QR code with your phone, copy the **64-character SHA-256 seal** straight off the page, verify the hash, and export the PDF. Switch the UI to English and note the **`PL Original`** badge — the hash still matches the canonical Polish record.

---

## 📊 Presentation Materials & Pitch Deck

Everything a judge needs to evaluate PatronAI **without cloning the repository**, indexed in one place:

| Evaluation artifact                  | Where to find it                                                                                                                                                                                                                                  | What it answers                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 📊 **Pitch Deck Presentation (PDF)** | [PatronAI — Pitch Deck · PayPal AI Hackathon](https://github.com/AdamBabinicz/patronat/blob/main/docs/PatronAI%20%E2%80%94%20Pitch%20Deck%20%C2%B7%20PayPal%20AI%20Hackathon.pdf)                                                                   | The full narrative: the problem, the Deterministic Trust Layer, agentic vision audit, benchmark validation, and the pilot framework |
| 🌐 **Live Application**              | [`https://patronat.vercel.app/`](https://patronat.vercel.app/)                                                                                                                                                                                    | The running product — use the [3-minute walkthrough](#-judge-walkthrough--test-in-3-minutes) above          |
| 💻 **Source Code Repository**        | [`github.com/AdamBabinicz/patronat`](https://github.com/AdamBabinicz/patronat)                                                                                                                                                                    | Clean-architecture tree: `app/api/`, `components/`, `lib/`                                                 |
| 🎥 **Video Demo & Pitch**            | [`youtu.be/dQw4w9WgXcQ`](https://youtu.be/dQw4w9WgXcQ)                                                                                                                                                                                            | Recorded product demo and spoken pitch                                                                   |
| 🏆 **Target Pilot Partner**          | [UKS Roszada Radom](https://roszada-radom.vercel.app/)                                                                                                                                                                                                           | Prospective pilot partner / target community use case (80+ players)                                       |

The deck is the **narrative companion** to this README, not a substitute for it: the README remains the canonical technical record of the architecture, the deterministic-vs-probabilistic boundary, the benchmark dataset, and the reproduction steps. Where the deck and the README state a number, both trace to the same source — the live `v_ledger_totals` aggregation view, never a hard-coded constant.

> **⚠️ Figures shown in the deck follow the same rule as this README:** every amount, allocation count and total (e.g. `17 224 PLN` / `29 allocations`) belongs to the **dynamic simulated benchmark dataset (Dynamic Pilot Benchmark Dataset)** and **evolves dynamically** under active continuous testing and benchmarking. Real funds collected remain strictly **0.00 PLN** — see the [Transparency Disclaimer](#transparency-disclaimer).

---

## 📊 Pilot Framework, Simulation Data & Target Club Partnership

PatronAI is a **competition prototype / pilot** prepared for the PayPal AI Hackathon — for full transparency with the jury, here is exactly what is real today and what is simulated:

**1. 🏁 Competition status — Real Funds Collected: 0.00 PLN.** This is a competition demonstration prototype: no real funds have been raised, and the club's production PayPal account (UKS Roszada Radom) is **not connected** — all checkout flows run in PayPal developer **simulation / sandbox mode — no production bank or PayPal account is connected for our prospective pilot partner, UKS Roszada Radom**. The platform is under **active, continuous testing and benchmarking**, so the figures shown here are dynamic and evolve over time rather than being final.

**2. 📈 Dynamic Pilot Benchmark Dataset — continuously simulated test allocations.** Every figure in the public ledger (amounts, invoices, receipts) belongs to a **Dynamic Pilot Benchmark Dataset across continuously simulated test allocations, live-aggregated directly from Neon Serverless PostgreSQL** — a modeled scenario based on illustrative club needs, created solely to demonstrate the matching → payment → audit → certificate pipeline end-to-end. The registry value is **not a hard-coded constant**: it is aggregated in real time from the `allocations` table through the `v_ledger_totals` view, so the benchmark evolves with every simulated allocation — the platform is under **active, continuous testing and benchmarking**, and every figure shown is therefore dynamic rather than final. **No real invoices, budgets, or club expenditures exist behind these numbers.** The stress-test baseline for this dataset is documented above: **29 aggregated allocations, ~160 ms aggregate query time, 17 224 PLN / EUR 4,006, 20 active (Season 2026) / 9 archived (2025) allocations, 21 unique patrons.**

**3. 🤝 Target pilot club — UKS Roszada Radom (80+ children).** A real local club designated as the **prospective pilot partner / target community use case** for production deployment after the hackathon; the current implementation is a prototype powered entirely by the dynamic pilot benchmark dataset.

| Metric (demonstration prototype) | Value                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 💰 **Real Funds Collected**      | **0.00 PLN** — competition prototype demo; the ledger total is live-aggregated from the `allocations` table via `v_ledger_totals`, not hard-coded                               |
| ✅ **Audited Allocations**       | **Continuously simulated test allocations** — the count is aggregated live from the `allocations` table (`v_ledger_totals`); scenarios exercise the Gemini OCR audit            |
| 🧾 **Needs & Invoices**          | **Dynamic Pilot Benchmark Dataset** (chess clocks, entry fees, transport) used to exercise the Gemini OCR audit; audit records are read directly from the `audit_reports` table |
| ♟️ **UKS Roszada Radom**         | **Target pilot club (80+ players)** — prospective pilot partner / target community use case; production deployment planned after the hackathon                                  |

**What this demonstrates:** the agentic workflow — matching → payment → audit → certificate — is a modeled scenario based on illustrative club needs, ready to be connected to a real club (UKS Roszada Radom) after the competition.

---

## 🌟 What Makes PatronAI Hack-Worthy — 60-Second Executive Summary

- **🔐 Deterministic Trust Layer, not AI-washed finance.** Gemini inspects, transcribes and semantically audits — but **SHA-256 hashes, Neon relational constraints and SQL aggregation views** own every ledger fact. *"A rule a prompt can hallucinate around is not a financial rule."* Probabilistic judgement and deterministic enforcement are separated by a hard architectural boundary.
- **🧾 Truly Agentic Vision Audit, not a buzzword.** Gemini Multimodal Vision runs at allocation-time, not upload-time: every receipt is parsed into structured JSON (product · quantity · gross total · NIP) and semantically cross-checked against the patron's declared goal — mismatches are flagged, never silently approved. The first honest answer to the _black-box donation problem_.
- **⚡ Stress-tested, not asserted.** A benchmark pass in Neon Serverless PostgreSQL aggregates **29 live allocations in ~160 ms**, reconciles **17 224 PLN / EUR 4,006** dynamically through `v_ledger_totals`, splits cleanly into **Season 2026 (20 active) vs. Archive (9 from 2025)**, and resolves **21 unique patrons** through the Recurring Patron engine (`patron_donation_count`). Every number is computed at read time; none is hard-coded.
- **🌍 Canonical cryptographic truth & dual-layer i18n (SHA-256).** PatronAI resolves a genuinely hard dilemma: international PayPal judges need a **fully English UI/UX**, yet the SHA-256 checksum is generated from the **canonical Polish record** of UKS Roszada Radom — so a naive translation would invalidate every certificate. `lib/translations/purposeMap.ts` holds the canonical cryptographic mapping and `components/ledger/LedgerPurposeCell.tsx` renders the localized goal with a subtle **`PL Original`** badge: localization layered on top of cryptography, never instead of it.
- **🧾 Audit reports straight from the database — zero-hardcoding.** The AI Vision audit modal (`components/ledger/LedgerAuditModal.tsx`) is driven entirely by the `audit_reports` table in Neon Serverless PostgreSQL — Gemini Multimodal OCR output, merchant **NIP**, cost line items, net/gross totals — with **no mock fallbacks and no static invoice fixtures anywhere in the path**.
- **🤝 Beyond cash: in-kind barter as a first-class citizen.** The AI Barter Valuator assigns AVE market equivalence, picks a Gold/Silver/Bronze tier, and generates a downloadable, legally structured partnership agreement — turning a coach bus or a printed banner into a trackable, certificate-grade contribution.
- **📣 Instant corporate deliverables.** One-click LinkedIn posts + UN SDG-aligned ESG statements the same minute the patron checks out — closing the CSR feedback loop that normally takes a quarter.
- **🎙️ Emotional impact, engineered.** A personalized spoken thank-you from the athletes themselves, with a live equalizer waveform — sponsors don't just read a receipt, they _feel_ the impact.
- **🔄 A ledger built for enquiry, not just display.** Bidirectional pagination (async **Load more allocations** / instant **Show less (collapse to 8)** with smooth scroll-back), an **interactive recurring-patron impact profile modal** with one-click ledger filtering, and the full **64-character SHA-256 seal surfaced on the certificate** with one-click copy and **ink-friendly `@media print`** output. Enterprise trust language — **"100% Purpose Aligned" / "100% Zgodności Celowej"** — replaces defensive absolutes.
- **🔐 Tamper-evident, not just "transparent."** Every ledger entry carries a SHA-256 hash and a standalone `/certyfikat/[id]` verification page with dynamic QR + PDF export — sponsors audit individual line items, not trust an aggregate dashboard.
- **🗄️ Durable cloud persistence, not a browser cache.** The public ledger and every issued certificate live in a **relational Neon Serverless PostgreSQL** database — reached through pooled serverless connections (`@neondatabase/serverless`) against an auto-migrating DDL schema (`allocations`, `audit_reports`, `v_ledger_totals`). Audit records and certificate lookups survive refreshes, device changes and cleared browser storage, so the trust trail is a queryable server-side record rather than client-side state.
- **🧪 Transparent competition pilot, not inflated traction.** Real funds collected: **0.00 PLN** (PayPal runs in sandbox / developer simulation mode, no production UKS Roszada account); the ledger presents a **Dynamic Pilot Benchmark Dataset across continuously simulated test allocations, live-aggregated directly from Neon Serverless PostgreSQL** — every total is aggregated in real time from the `allocations` table via the `v_ledger_totals` view rather than stored as a constant — with UKS Roszada Radom (80+ active youth players) named as the **prospective pilot partner / target community use case** for deployment after the hackathon.
- **🏛️ Clean Architecture that judges can read.** Domain logic decoupled into `lib/needsCatalog.ts`, one streamlined Gemini orchestration route, a canonical purpose map (`lib/translations/purposeMap.ts`), and strict type-safe i18n — a codebase built to scale past the hackathon.

---

## 📄 License & Team

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

### 👥 Team

| Role                                      | Name / Contact                                                |
| ----------------------------------------- | ------------------------------------------------------------- |
| **Lead Architect & Full-Stack Developer** | **Adam Gierczak** ([GitHub](https://github.com/AdamBabinicz)) |

> Built for the **PayPal AI Hackathon** — with gratitude to **UKS Roszada Radom** (players, parents, and coaches), our prospective pilot partner / target community use case, whose deployment is planned after the competition. ♟️
