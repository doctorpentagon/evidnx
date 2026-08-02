# GitHub, Supabase, Render, Vercel Deployment Plan

Deployment happens after M0 and the M1 golden path pass locally.

## Target architecture

- GitHub: source, pull requests, CI, branch protection.
- Vercel: React/Vite static frontend.
- Render: Express API and background/export work.
- Supabase: PostgreSQL database and Storage. Authentication remains disabled for the initial no-login beta; a scoped demo workspace is used.

## Step sequence

1. Make the repository build and test clean; remove generated database/WAL files and secrets from version control.
2. Create the first local commit with the audit, architecture decision records, migrations, app, and tests.
3. Create a private GitHub repository, add `origin`, push a feature branch, and verify GitHub Actions.
4. Create the Supabase project in the chosen region; record project URL, pooled database URL, direct migration URL, and storage bucket configuration in local environment files that remain uncommitted.
5. Convert Drizzle schema/migrations from SQLite to PostgreSQL; run migrations against a non-production environment and seed only non-sensitive demo data.
6. Configure Render with build/start/health commands, `DATABASE_URL`, allowed Vercel origins, file limits, and Supabase service credentials only where server-side storage access is required.
7. Verify the Render API health endpoint, migrations, CORS, structured logs, persistent data, import limits, and analysis golden path.
8. Configure Vercel with the client root, production API URL, SPA rewrite, security headers, and preview environment.
9. Test the complete deployed flow at desktop/tablet/mobile sizes, including direct-route refreshes and failure states.
10. Promote to production only after backup/restore and rollback are documented and a release tag is created.

No GitHub repository, Supabase project, Render service, or Vercel project should be created before the local build and statistical quality gates pass. External account actions and secret entry require the user's authenticated sessions and explicit confirmation at action time.
