# EvidNX — Product & Engineering Specification (v1)

Status: **DRAFT FOR SIGN-OFF**. This document consolidates six research passes over every source
file in `c:\Users\USER\Desktop\EvidNX\` (the template-coder engineering playbook, the EvidNX vision
docs, the DataTab teardown, the Numiqo teardown, the design mockups, and the prior sample-built
codebase audit) into one buildable plan. It corrects academic-only framing, cuts unrealistic scope,
and fixes the stack/architecture. Raw research is preserved in
`<scratchpad>/research_*.md` for anyone who wants the underlying detail.

---

## 1. What EvidNX is (corrected positioning)

**EvidNX is a statistical analysis and research-workflow tool for anyone who has to turn raw data
into a defensible written result** — researchers, analysts, consultants, students, NGOs, and
professionals. It directly competes with **DataTab/Numiqo** (a browser stats calculator) but goes
further end-to-end: questionnaire design → data collection → cleaning → analysis → plain-language
interpretation → literature grounding → a finished report.

It is explicitly **not** limited to university students or thesis-writers. The original planning
docs framed the entire product around "African university students" finishing "Chapter 4/5" of a
thesis, with "Supervisor," "Student ID," and "University email" baked into the data model and UI
copy. That framing is removed below — the underlying features are kept, renamed generically.

---

## 2. Renaming pass (function kept, academic-only naming removed)

| Old (academic-only) | New (general-purpose) | Where it appeared |
|---|---|---|
| "Chapter 4" / "Chapter 5" report | **Results & Discussion Report** (single "Reports" feature) | Reports page, sidebar nav (nav label "Reports" was already generic — only the in-document eyebrow/labels change) |
| "Insert into Chapter 4" (CTA) | **"Add to Report"** | AI Interpretation screen, Summary modal |
| "CHAPTER FOUR" eyebrow / doc title | **"REPORT"** eyebrow / "Results and Discussion" | Reports document view |
| Tone switcher: Plain / Academic / **Thesis** / **Supervisor** | Plain / Academic / **Detailed** / **Executive Summary** | AI Interpretation screen |
| "Is this strong enough for **my thesis**?" | "Is this strong enough to report?" | Follow-up chip |
| "**University** email" field | **"Email"** (no domain restriction, no example .edu address) | Sign-up/onboarding |
| "What are you working on? Undergraduate project / Thesis-dissertation / Journal paper" | **"What are you working on? Research project / Business report / Personal project"** | Onboarding — see §4, this screen is dropped entirely since there's no auth in this build |
| "**Supervisor** share link", Supervisor as data-model entity | **"Reviewer/Collaborator" share link** (deferred feature, see §7) | evidnx.txt MVP list, data model |
| "Defense"/"viva questions" | **"Anticipated questions"** (folds into follow-up chips) | AI interpretation |
| "Student ID" profile field | **dropped** (no identity system in this build) | Identity model |
| "Standard for **social-science research**" helper text | **"Standard for most research and analysis"** | Test config screen |
| "**Student** Sleep & GPA" example project | **"Sleep & Productivity Study"** | Dashboard sample data |
| Pricing tier "**Student Pro**" | **"Pro"** (pricing/billing itself is out of scope for this build) | Business-model slide only, not built |
| Flow-diagram goal picker "project · **thesis** · paper" | **"research project · report · paper"** | Not a real screen, docs only |

Nothing about *analysis rigor or features* changes — a results/report generator, a review-sharing
link, and a "why this test" coaching layer are all still built. Only names, field labels, and
persona framing change.

---

## 3. Corrected scope: cut list (from Section C of the vision audit)

The two large spec docs describe a "Research Operating System" with **50+ modules, 60+ named AI
agents, multi-tenant billing/SSO/enterprise IAM, industrial Six Sigma/DOE/SPC/MSA tooling, survival
analysis, Monte Carlo simulation, and a 25-volume architecture doc** — against an original budget/
timeline of $17,500 and 6 months. That gap is the single biggest risk in the whole project. This
build **explicitly cuts**, indefinitely deferred unless requested later:

- Multi-tenant/billing/licensing/SSO/enterprise IAM platform layer
- The 60-agent AI orchestration architecture (Tier 1/2/3 agents, "every screen has an AI")
- Industrial/Six Sigma suite: DOE, SPC, MSA, Process Capability, Gauge R&R
- Survival analysis (Kaplan-Meier, Cox regression) — clinical-trial-specific, low relevance to core users
- Monte Carlo simulation, market-basket/association-rule analysis
- Full "Publication Intelligence" (journal matching, reviewer simulation, submission tracking)
- Live web-scraping literature search (Google Scholar/SerpAPI) — fragile, ToS-risk, not core to
  the stats value prop; replaced with a manual reference library that still produces real, working
  citation formatting (see §7)
- Any authentication/identity system (explicit product decision — see §5)

This is not scope-cutting for its own sake — it's the difference between a demo that claims 70+
statistical methods and one that actually, correctly computes the ~20 methods researchers use 95%
of the time, with real assumption-checking and real plain-language interpretation. Depth over
breadth.

---

## 4. Stack decisions

The template-coder playbook (`template coder/`) explicitly mandates a stack — this is not a free
choice. Followed as-is, with one deliberate, documented deviation:

| Layer | Decision | Rationale |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query + React Hook Form + Zod + React Router + Lucide icons | Directly mandated by `4. frontend/` and `3. design/iconography.md` |
| Backend | Node.js + Express + TypeScript, Controller → Service → Repository layering | Mandated by `CLAUDE.md`; backend_architecture.md itself is an empty stub (confirmed — see playbook §5.1), so this is the only real backend doctrine that exists in the source docs |
| API style | Plain REST (`/projects/:id/datasets/:datasetId/analyses`), not tRPC | Matches the template's explicit URL-design rule ("nouns not verbs") and its `UI → hook → service → API client → Backend` chain. The sample-built app used tRPC with fictional, never-implemented endpoints cast to `any` — REST is simpler to debug, document, and ship as a downloadable app |
| Database | **SQLite via Drizzle ORM** (`better-sqlite3` driver), one file on disk | **Deviation from the template's Postgres/Mongo decision tree**, made explicitly because the product must be "downloadable and just run" with zero external services (no Postgres server to install). SQLite still gives full relational integrity + SQL reporting queries, which is what the decision tree is actually optimizing for. Swapping to Postgres later is a driver change, not a schema rewrite, since Drizzle abstracts the dialect. |
| Stats engine | TypeScript, in the Node backend, using `jstat` (distributions/p-values) + `ml-regression`/`ml-pca`/`ml-kmeans` (`ml.js` family) for regression/PCA/clustering, hand-rolled implementations checked against known reference values for t-test/ANOVA/chi-square/correlation | No Python dependency — keeps "download and run" to `npm install && npm run dev`, nothing else |
| AI interpretation | **Deterministic, template-based interpretation engine** (not a live LLM call) as the default and only mechanism | This is what makes "100% working, no login" actually true out of the box — no API key required, no per-request cost, nothing that breaks when offline. It mirrors DataTab's "AI Interpretation" (column-by-column plain-language explainer using the *real computed numbers*) and "Summary in words" (APA-style narrative) patterns, built with real template logic against real statistics, not a mocked string. The architecture keeps this behind a `services/interpretation` seam so a real LLM can be swapped in later without touching UI code. |
| Auth | **None in this build** (explicit product decision) | See §5 |
| Monorepo layout | `evidnx/client` (Vite React app) + `evidnx/server` (Express API), npm workspaces, one root `npm run dev` starts both | Matches both prescribed folder trees from the playbook |

---

## 5. Auth: skipped, by design, without painting into a corner

Per your instruction, this build has **no login, no signup, no accounts**. Practically:

- The app behaves like a local, single-workspace research tool — open it, and you're in your
  workspace. All projects/datasets/analyses belong to one implicit local user.
- Every core table still gets an `owner_id` column defaulting to a constant `"local"` value (per
  the template's forward-compatibility rule, 4.13) — so adding real accounts later is a data
  migration, not a schema redesign.
- The mockups' sign-up screen (web-01-onboarding, mobile-01-onboarding) is **not built** as a login
  wall. Its "hero" content (headline, value props) becomes the empty-dashboard first-run state
  instead; its "Create account" form is dropped entirely.
- The API client is still built with an auth-header-injection interceptor slot (per template
  4.13) — present but a no-op today.

---

## 6. Corrected MVP feature list, by screen/nav section

This maps 1:1 onto the sidebar nav already shown in the mockups (**Dashboard, Questionnaires,
Data, Analysis, Literature, Reports, Learn** — the nav labels themselves were already generic, no
renaming needed there).

### 6.1 Dashboard
- Project list with progress bars, "continue where you left off" card
- Quick stats: active projects, responses collected, analyses run, milestones (computed from real
  usage, not fake numbers)
- "+ New project" flow (topic + optional tag — replaces the dropped sign-up screen as the true
  entry point)

### 6.2 Questionnaires
- Drag-and-drop question builder: single choice, multiple choice, Likert (5-point), open text,
  numeric question types
- Rule-based "suggested questions" panel (keyword-matched templates against the project topic —
  no LLM call required)
- Publish → shareable link + generated QR code + printable offline PDF version
- Public response-collection form at a stable URL, saved directly to the dataset
- Response dashboard: response count, completion rate over target sample

### 6.3 Data
- Spreadsheet-style grid: type/paste directly, or import CSV/Excel
- Per-column type assignment: **Metric / Ordinal / Nominal** (kept exactly as DataTab/our mockups
  name it — this is standard statistics terminology, not academic-only)
- Data-quality panel: missing values, duplicates, completeness %
- **Prepare Data** cleaning checklist (web-04b pattern): missing-value handling, duplicate removal,
  outlier flagging + z-score standardization, type/labelling checks — each with a real computed
  status, not a static mock
- Recode variable (single-value / range remapping) and Create Index (sum/mean composite) — matches
  Numiqo's Transform Data menu, genuinely useful and cheap to build correctly

### 6.4 Analysis (the core of the product — matches DataTab/Numiqo parity, then exceeds it)
Sub-tabs (matches the mockups' own tab bar, which was already well-scoped):
- **Descriptive** — mean/median/mode/SD/variance/range/quartiles/skew/kurtosis, frequency tables,
  crosstabs
- **Charts** — bar, box plot, histogram, scatter; configurable orientation/points/color
- **Hypothesis tests** — one-sample/independent/paired t-test, one-way/two-way/repeated-measures
  ANOVA, chi-square, binomial, Mann-Whitney U, Wilcoxon, Kruskal-Wallis, Friedman — with
  **automatic test routing** based on selected variable types (matches DataTab's core mechanic)
- **Correlation** — Pearson, Spearman, Kendall's tau, correlation matrix heatmap
- **Regression** — simple/multiple linear, logistic, VIF multicollinearity check, residual plots
- **ANCOVA** — basic implementation
- **Mediation/Moderation** — basic moderation (interaction term), basic mediation (Baron & Kenny
  steps + Sobel test), built on top of the regression engine already required above
- **PCA** — principal components, scree plot, loadings
- **Reliability** — Cronbach's alpha, item-total statistics
- **Cluster** — K-means, 2D PCA-reduced visualization

Cross-cutting, applied everywhere above (**this is where we beat DataTab, per the competitor
teardown's own "gaps to beat" list**):
- **Assumption engine**: Levene's test, normality tests (Shapiro-Wilk, KS, Anderson-Darling),
  Mauchly's sphericity, VIF — each with a **plain pass/fail verdict badge**, not just raw p-value
  tables (DataTab never does this — confirmed gap in the teardown, Part 4)
- **AI Interpretation**: per-table, column-by-column plain-language explainer using the real
  computed numbers, on *every* result (DataTab has this only inconsistently)
- **Summary in words**: one-click APA-style narrative write-up of the whole test, with the renamed
  tone switcher (Plain / Academic / Detailed / Executive Summary)
- **Auto-analyze**: variable picker + one auto-recommended test with a "why not the alternatives"
  explanation (web-04c pattern) as the default entry point, with "choose manually" as the
  alternative path for power users
- **Assistant chat**: a constrained, template-driven Q&A over the current analysis's own results
  (not a general open-ended chatbot) — answers "why," "show me a chart," "explain this test" from
  the same deterministic interpretation engine

### 6.5 Literature (rescoped — see cut list §3)
- Manually add references: title/authors/year/journal/DOI/notes, optional PDF attachment
- **Automatic citation formatting** (APA/MLA/Harvard) computed from entered metadata — genuinely
  works offline, no scraping
- Tagging/notes per reference, "cite in report" action
- *Deferred*: live Google Scholar search, AI summarization, AI gap-analysis against literature —
  flagged in §3 as fragile/out of scope for this build

### 6.6 Reports
- Compile selected results (tables/charts/interpretations) into a structured document
  ("Results and Discussion" — see renaming table)
- Export to PDF and DOCX; print-friendly view
- Insert citations from the Literature library automatically formatted in the chosen style

### 6.7 Learn (our differentiation vs. DataTab's disconnected help site)
- **In-app, contextual** glossary/tutorial linked directly from results ("Learn about ANOVA" links
  next to the test that was just run) — not a separate site you tab away to
  (this directly closes the gap identified in the DataTab teardown, Part 3)
- Interactive mini-widgets per concept (e.g., t-distribution/critical-value calculator, mirroring
  DataTab's embedded-calculator pattern, which is worth keeping since it's genuinely good UX)

---

## 7. Explicitly deferred (not built now, not lost — documented for later)

- Any authentication/accounts/collaboration/sharing (Reviewer share-link, multi-user roles)
- Billing/pricing tiers
- Live literature search/scraping
- Gamification beyond real, computed counters (streaks/badges shown on the dashboard use *real*
  usage data now; a full reward/nudge engine is deferred)
- Mobile native app (React Native) — the web app will be responsive/mobile-first per the design
  system, but a packaged mobile app is out of scope here

---

## 8. Architecture

```
evidnx/
├── client/                        # React + Vite frontend
│   └── src/
│       ├── app/                   # bootstrap, providers, global config
│       ├── assets/
│       ├── components/            # shared cross-feature UI (Button, Card, Table, etc.)
│       ├── features/
│       │   ├── dashboard/
│       │   ├── questionnaires/
│       │   ├── data/
│       │   ├── analysis/
│       │   ├── literature/
│       │   ├── reports/
│       │   └── learn/
│       │       └── <each>/{components,hooks,services,pages,types,tests}
│       ├── hooks/
│       ├── layouts/                # AppShell (sidebar+topbar), PublicLayout (response forms)
│       ├── lib/
│       ├── providers/
│       ├── routes/
│       ├── services/               # API clients
│       ├── styles/                 # design tokens (colors, type scale, spacing)
│       ├── types/
│       ├── utils/
│       └── main.tsx
├── server/                         # Express + TypeScript backend
│   └── src/
│       ├── app/
│       ├── bootstrap/
│       ├── config/
│       ├── core/                   # db client, drizzle instance
│       ├── features/
│       │   ├── projects/
│       │   ├── questionnaires/
│       │   ├── datasets/
│       │   ├── analyses/           # the stats engine lives here
│       │   ├── literature/
│       │   └── reports/
│       │       └── <each>/{controllers,services,repositories,dto,validators,routes,tests}
│       ├── infrastructure/         # sqlite file, drizzle schema/migrations
│       ├── middleware/
│       ├── shared/
│       ├── server.ts
│       └── index.ts
├── docs/
│   └── SPEC.md                     # this file
├── package.json                    # npm workspaces root
└── README.md                       # setup + run instructions
```

Design tokens (colors, type scale, spacing, radii) are taken directly from the mockups (§9) and
implemented as Tailwind theme extensions + CSS variables, per the design-token mandate — never
hardcoded hex values in components.

---

## 9. Visual design system (from the mockups — build to this exactly)

- **Brand mark**: rounded-square blue tile with a bold white "E" + "EvidNX" wordmark. Fixed spec,
  reused everywhere (sidebar, mobile splash, reports).
- **Colors**: primary blue `#1466d6` (nav/primary actions), AI/success green `#1f9d63`
  (analysis/export actions, success states), dark navy `#0d1f38` (sidebar chrome), amber `#c9822a`
  (warning/suggested/missing), body text `#0f1a2b`, muted text `#5b6b80`, card border `#dbe3ee`. No
  red exists in the mockups — a semantic error red will be added (not in source, needed for real
  error states per the design system's own accessibility rules).
- **Typography**: Inter throughout (400/500/600/700/800), bold tight headings, 16px body default.
- **Components**: white cards (~12–16px radius, 1px border, soft shadow), pill buttons (solid
  blue = primary, solid green = AI/export actions, outline = secondary), light-blue tinted "AI
  panel" boxes with a circular "+" icon avatar (the single most-repeated component), light-green
  success banners, horizontal underline tabs, minimal-icon aesthetic (status dots/badges over
  heavy iconography).
- **Layout**: persistent dark-navy sidebar (~220px) + light canvas content area, matching the
  template's CRUD/dashboard archetype.

Full screen-by-screen specs for all 27 unique screens are in
`research_design_system.md` and will be followed exactly during frontend build.

---

## 10. What "done" looks like for this build

A user can, with zero configuration and no login: open the app → create a project → build a
questionnaire → collect responses (or import a CSV directly) → clean the data → get an
auto-recommended statistical test → see real computed results with real assumption checks → read a
genuine plain-language interpretation of their own numbers → add a manually-entered reference with
a correctly formatted citation → generate a results report → export it as PDF/DOCX. Every step
above produces real output from real computation — nothing is a static mock.
