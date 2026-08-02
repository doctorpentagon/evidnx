# EvidNX

EvidNX is a guided statistical analysis, education, and evidence-workflow platform for undergraduates, researchers, analysts, young professionals, NGOs, consultants, and teams.

The product is being built around one trustworthy chain:

`import or collect data -> profile and clean -> define the analysis question -> recommend a method -> check assumptions -> compute tables and charts -> interpret with caveats -> add to a reproducible report`

## Current status

This repository is an engineering beta, not a finished statistical product.

Working foundations:

- React/Vite workspace and responsive public landing page
- Responsive application shell with desktop sidebar and mobile/tablet drawer
- Express API with project, questionnaire, dataset, analysis, literature, and report modules
- SQLite local-development schema, migrations, and seed data
- CSV and `.xlsx` import/export through Papa Parse and ExcelJS
- Data cleaning, recoding, index creation, and early semantic type inference
- Early statistical kernel plus deterministic guided-interpretation services
- Golden regression tests for core descriptive and inferential calculations

Still being completed and validated:

- Full analysis user interface and reactive charts
- Broader golden fixtures against R/SciPy/statsmodels
- Complete assumptions harness and explainable method recommender
- Literature, report, and contextual Learn interfaces
- Supabase PostgreSQL/Storage production adapter
- Optional model-powered assistant with evidence grounding and evaluation
- Authentication, billing, and team collaboration

See [the engineering audit](docs/ENGINEERING_AUDIT.md), [foundational top 20](docs/FOUNDATION_TOP_20.md), and [deployment plan](docs/DEPLOYMENT_PLAN.md).

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Install and run

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4010`
- Health: `http://localhost:4010/api/health`

## Quality checks

```bash
npm run check
```

This compiles the production server/client and runs the statistical golden tests.

## Database

```bash
npm run db:push
npm run db:seed
```

SQLite is currently used for zero-configuration local development. The cloud target is Supabase PostgreSQL with Supabase Storage; see `docs/DEPLOYMENT_PLAN.md`.

## Statistical and AI safety

- Compilation is not statistical validation. Every exposed method requires trusted reference fixtures and explicit assumptions.
- Current written output is deterministic **guided interpretation**, not AI.
- A future model assistant may explain structured results, but must never invent or recompute statistics.
- Never commit `.env` files, credentials, service keys, or user datasets.

## Structure

```text
client/   React + Vite + TypeScript frontend
server/   Express + TypeScript API and statistical kernel
docs/     Product specification, audit, foundation, and deployment decisions
```

## License

MIT. See [LICENSE](LICENSE).
