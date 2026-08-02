# EvidNX Foundational Top 20

This order is deliberate. Items 1-12 create one trustworthy competitor-grade analysis flow. Items 13-20 make it usable, explainable, and deployable.

1. **Define the evidence contract.** Every output stores dataset version/hash, selected columns, exclusions, missing-data rule, test settings, engine version, assumptions, result, and timestamp.
2. **Replace cloud SQLite with Supabase Postgres.** Use Drizzle PostgreSQL migrations; keep storage for uploaded datasets and future PDFs in Supabase Storage.
3. **Create a validated statistical kernel boundary.** Pure typed functions, explicit errors, no database/UI dependencies, deterministic results, numeric tolerances.
4. **Build golden reference tests.** Compare every supported test against trusted R/SciPy/statsmodels fixtures before exposing it.
5. **Ship a narrow validated test catalogue first.** Descriptives/frequencies, Pearson/Spearman, one-sample/paired/independent/Welch t-tests, chi-square/Fisher, one-way ANOVA/Welch ANOVA, Mann-Whitney, Wilcoxon, Kruskal-Wallis, and linear regression.
6. **Build robust CSV/XLSX ingestion.** Sheet/header detection, delimiters, dates, locale decimals, blanks, duplicate headers, IDs, mixed types, file limits, and an import preview before persistence.
7. **Build a data profiler and semantic typing model.** Numeric/categorical/ordinal/date/text/identifier plus measurement level, confidence, evidence, warnings, and user confirmation.
8. **Build data-quality diagnostics.** Missingness by row/column, duplicates, impossible values, constant/near-constant columns, sparse categories, outliers, and analysis-ready sample size.
9. **Create an explainable analysis-intent wizard.** Ask the user's question and design—not only which columns were clicked.
10. **Create a rule-based test recommender.** Return recommended test, alternatives, reasons, required assumptions, confidence, blockers, and user-overridable choices. Prefer Welch over pooled t-test when variances differ; do not substitute a rank test solely for heteroscedasticity.
11. **Create the assumption harness.** Normality diagnostics, Q-Q data, variance checks, expected cell counts, linearity/residuals/influence, independence/design confirmations, and pass/warn/fail/not-applicable verdicts.
12. **Complete the vertical golden path.** Upload -> profile -> select question -> recommend -> assumptions -> run/fallback -> tables/charts -> interpretation -> save to report.
13. **Implement live graphing honestly.** Charts recompute immediately from in-memory selections and saved dataset changes; show loading and stale states; include histogram, box, bar, scatter/regression, residual, Q-Q, and confidence intervals. “Real-time” means reactive computation, not streaming AI.
14. **Build a deterministic interpretation layer.** Use actual result objects, effect sizes, confidence intervals, assumption status, and caveats. Label it “Guided interpretation,” not AI.
15. **Add an optional model-powered analysis assistant behind a provider interface.** The model receives structured evidence, never invents numbers, cites result fields, and is clearly marked optional. Add evaluation fixtures, prompt versioning, token/cost limits, refusal/fallback behavior, and no-provider mode.
16. **Build report composition and exports.** Editable sections, provenance-linked tables/charts, citation insertion, reproducible reruns, DOCX/PDF export, and stale-result warnings.
17. **Build contextual Learn.** Each assumption, statistic, and recommendation links to an in-app explainer and interactive calculator using the user's current values where safe.
18. **Rebuild responsive application navigation.** Desktop sidebar, tablet rail/drawer, mobile top bar + drawer/bottom critical navigation, responsive cards/tables/modals, and mobile-friendly result summaries.
19. **Add the public landing page with honest slightly-expanded copy.** Explain the guided workflow, show the analysis chain, separate available/beta/planned features, and route into a sample workspace without login.
20. **Establish engineering/deployment gates.** CI builds/tests, lint/format/typecheck, error tracking, structured logs, rate limits, health endpoints, environment checks, preview deployments, seed/demo dataset, backups, and rollback documentation.

## Milestones

### M0 - Repair and contracts

Items 1-4, 18 baseline, build green, testing harness established.

### M1 - Trustworthy analysis beta

Items 5-14 as one complete flow using a sample dataset and user uploads.

### M2 - Research workflow

Items 16-17 plus questionnaires/reference management only after the analysis flow is stable.

### M3 - Public beta and deployment

Items 19-20, then GitHub -> Supabase -> Render -> Vercel.

### M4 - Optional intelligence

Item 15 after deterministic output is validated. Model output augments the engine; it never replaces formulas or recomputes statistics.
