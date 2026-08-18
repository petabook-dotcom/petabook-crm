# Petabook CRM

B2B pipeline for converting dog hotels. Every prospect is entered by hand. The pipeline runs
from first contact through `Onboarding`, which is the final completed stage.

Forked from the architecture of `vektrum-crm` and `crm-oeiras360` (Next.js App Router +
Supabase + Server Actions, no REST layer, no ORM, no component library), with three
deliberate fixes over both: a server-side password gate, strict database isolation,
`prospect_contacts` as its own table instead of one flat contact per prospect, and
`outreach_touches` modelled as data instead of left in a Markdown file.

## Database isolation

The app uses exactly one Supabase project: `ubdwuzmvxxmfihtgxvmx` ("Petabook CRM"). The
server validates that hostname before creating a client. There are no browser database keys,
external database clients, or links to another application.

## First-run setup

1. Fill in the four server-only values in `.env` (see `.env.example`).
2. `npm install`
3. Apply the migrations to the dedicated CRM project.
4. `node scripts/seed-storage.mjs` — uploads the starter battlesheet + one outreach
   template from `content/` into Storage.
5. `npm run dev`, enter the shared password, then add prospects by hand from `/pipeline`.

## Conventions

- The password gate is implemented at `/access`; `proxy.ts` guards routes and every mutation
  calls `requireCrmAccess`.
- Every database and Storage request uses `getSupabaseAdminClient` from server-only code.
  RLS stays enabled and browser roles have no table grants.
- One `STAGE_META` record (`types/crm.ts`) drives every stage color, badge, kanban column,
  and next-action suggestion — both reference CRMs duplicated this across 3–4 files.
- `lint` is `tsc --noEmit` (no ESLint).
