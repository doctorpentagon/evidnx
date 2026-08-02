# EvidNX Engineering Audit

Date: 2026-08-02

## Verdict

EvidNX is an incomplete prototype, not a deployable analytics product. The current repository has useful domain scaffolding and early dataset/statistics code, but the production build fails, the core analysis UI is absent, responsiveness is broken, no automated statistical validation exists, and the current SQLite deployment model conflicts with the requested Vercel + Render + Supabase architecture.

## Verified facts

- Production build fails in the server TypeScript compilation with unsafe result contracts and missing `jstat` declarations.
- The repository has no commit history and no configured Git remote.
- Analysis, Literature, Reports, and Learn pages render `ComingSoon`.
- Recharts is installed but no chart component uses it. Graph plotting does not exist yet, real-time or otherwise.
- No unit, integration, golden-dataset, accessibility, or end-to-end tests exist.
- Desktop renders, but the dashboard waits forever when the API is unavailable and offers no useful failure state.
- At 768px the fixed 220px sidebar leaves only 548px for the product and breaks header/action layout.
- At 390px the fixed sidebar leaves about 155px for content, creates a 540px document width, clips the dashboard, and forces horizontal scrolling.
- There is no public landing-page route. The app opens directly on the workspace dashboard.
- CSV/XLS/XLSX parsing exists, but scale inference only returns nominal or metric. Low-cardinality numeric fields such as Likert 1–5 are explicitly classified as metric.
- A group-comparison recommender exists, but its decision surface is narrow and it routes unequal variance to Mann–Whitney rather than Welch's t-test.
- Template-based interpretations exist for a limited subset of tests. This is not an AI agent and must not be marketed as one.
- The assistant/chat workflow in the design is not implemented.
- Reports can be represented in backend code, but the frontend and verified PDF/DOCX end-to-end export workflow are absent.

## Competitor/design reconciliation

The 60 DataTab images show two linked products: a statistics calculator and a separate tutorial/knowledge site. DataTab's strongest chain is data grid -> variable scale assignment -> test configuration -> assumptions -> result tables/charts -> AI interpretation/summary. Its important weaknesses are raw assumption output without a simple trust verdict and learning content that is disconnected from the user's current analysis.

The EvidNX v2 mockups correctly propose the differentiated chain: dataset detection -> explainable recommended test -> assumptions with pass/warn/fail -> automatic fallback -> result -> editable interpretation -> add to report -> contextual Learn. That complete chain must be the first product milestone. Implementing many disconnected tests before this chain would repeat the earlier failure.

The files `11aa.jpg` through `11au.jpg` are EvidNX pitch-deck slides, not competitor UI. They are product/marketing context only and must not be used as evidence that a competitor or EvidNX has shipped those capabilities.

## Statistical and trust risks

1. Statistical routines are hand-written and have no reference-value tests against R, SciPy, statsmodels, or trusted published examples.
2. Shapiro-Wilk, non-parametric tests, ANOVA variants, mediation/moderation, PCA, and clustering require independent validation before user-facing claims.
3. Missing-value policy and row alignment can silently change paired and multivariable analyses unless a single analysis-ready case mask is applied.
4. Measurement level cannot be inferred from values alone. Header semantics, uniqueness, integer range, monotonic order, date detection, identifiers, and user confirmation are required.
5. Test recommendation must model research intent/design: outcome, predictors, groups, repeated/independent samples, number of groups, distribution, variance, sample size, and missingness.
6. Interpretations must state limits: association is not causation, non-significance is not evidence of no effect, p-values are not effect sizes, and assumptions influence confidence.
7. No feature should be labelled AI unless an actual model is invoked and the provenance, inputs, limitations, and failure state are visible.

## Deployment gap

SQLite is suitable for a downloadable local edition but unsuitable as the source of truth on Render's ephemeral filesystem and incompatible with Supabase as currently requested. The deployable edition should use Supabase Postgres and Supabase Storage, with Drizzle using the PostgreSQL dialect. A local SQLite adapter can remain a later optional desktop/local mode, but it must not be the cloud production database.

## Required quality gates before public deployment

- Clean server and client production builds.
- Golden statistical fixtures with tolerances and provenance.
- API integration tests for import -> profile -> recommend -> analyze -> save.
- Responsive verification at 360, 390, 768, 1024, 1280, and 1440 widths.
- Keyboard/accessibility checks and 44px touch targets.
- Empty, loading, error, partial-data, and retry states.
- Size/file-type limits, safe spreadsheet parsing, request validation, rate limits, and structured logs.
- Supabase migrations, backups, environment validation, and health checks.
- Honest landing copy that distinguishes available, beta, and planned capabilities.
