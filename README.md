# FORM

FORM is a Next.js app for logging body weight, calories, and measurements to estimate TDEE from real-world trend data.

Repository: https://github.com/HimashaHerath/Form

## What It Does

- Passwordless auth with Supabase magic links
- Onboarding flow for baseline settings
- Daily log tracking (weight + calories)
- Body measurement logging and body-fat estimation support
- Progress/history views with charts
- Import/export for user data

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Zustand for client state
- Supabase (Auth + Postgres via PostgREST)
- Tailwind CSS + Radix UI primitives
- Vitest + Testing Library

## Project Structure

```text
src/
  app/                    # routes (dashboard, log, history, body, settings, auth)
  components/             # UI, layout, forms, charts
  hooks/                  # domain hooks (e.g. TDEE calculations)
  lib/
    storage/              # DataStore interface + local/supabase implementations
    supabase/             # browser/server Supabase client helpers
    store.ts              # Zustand store and app hydration logic
    types.ts              # shared domain types
supabase/
  schema.sql              # required DB schema + RLS policies
```

## Prerequisites

- Node.js 20+ (Node 22.x recommended)
- npm
- A Supabase project

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project.

3. In Supabase SQL Editor, paste and run all SQL from `supabase/schema.sql`.

4. Configure Supabase Auth:

- Enable Email provider (magic link)
- Set Site URL to `http://localhost:3000`
- Add Redirect URL: `http://localhost:3000/auth/callback`

5. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

6. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` starts local development server
- `npm run build` creates production build
- `npm run start` runs production server
- `npm run test` starts Vitest in watch mode
- `npm run test:run` runs tests once (CI style)
- `npm run lint` runs ESLint

## Data Model

The app relies on three Supabase tables in `public`:

- `settings`
- `day_logs`
- `body_logs`

Row Level Security policies are required so authenticated users can only access their own rows. The provided `supabase/schema.sql` file creates tables, indexes, RLS policies, and grants.

## Contribution Guide

1. Create a feature branch from `main`.
2. Keep changes focused and scoped.
3. Run checks before opening a PR:

```bash
npm run build
npm run test:run
npm run lint
```

4. Include a clear PR description:

- What changed
- Why it changed
- Screenshots/GIFs for UI changes
- Any schema/env updates

5. If your work changes DB shape or auth behavior, update:

- `supabase/schema.sql`
- this README

## Troubleshooting

- `404` on `/rest/v1/settings`:
  `supabase/schema.sql` was not applied to the current Supabase project.

- `406` on `/rest/v1/settings`:
  Usually means querying a single row that does not exist yet; ensure you are on latest code and restart dev server.

- Auth redirects keep sending you to `/auth`:
  Verify `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and callback URL configuration.

- ESLint CLI crashes with `Cannot find module '../package.json'`:
  Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Notes

- Do not commit `.env.local`.
- Use only the public anon key on the client.
- Service-role keys must never be exposed in frontend code.
