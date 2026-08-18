# Petabook CRM

Internal B2B sales pipeline for dog-hotel prospects. Records are entered manually and the
pipeline ends at `Onboarding`.

## Isolation guarantee

The application can connect only to the dedicated Petabook CRM Supabase project
`ubdwuzmvxxmfihtgxvmx`. The server validates the configured hostname before creating a
database client. No database key is exposed to the browser, and there are no integrations or
links to another Petabook system.

## Environment

Copy `.env.example` to `.env` and configure these server-only values:

- `SUPABASE_URL` — must be `https://ubdwuzmvxxmfihtgxvmx.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — service-role key for the dedicated CRM project
- `CRM_ACCESS_PASSWORD` — shared password for the CRM access screen
- `CRM_SESSION_SECRET` — random 32-byte-or-longer signing secret

Never prefix these variables with `NEXT_PUBLIC_`.

## Setup

```bash
npm install
supabase db push
node scripts/seed-storage.mjs
npm run dev
```

Open `http://localhost:3000`, enter the shared password, and start adding prospects.

## Verification

```bash
npm run lint
npm run build
```

For Vercel, configure the same four variables for Preview and Production. Preview deployments
should be smoke-tested before promoting the same artifact to Production.
