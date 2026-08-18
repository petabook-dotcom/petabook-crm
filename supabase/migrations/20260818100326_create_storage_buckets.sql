-- Private buckets for outreach templates and the sales battlesheet.
-- Read only by the server-side admin client (see lib/content.ts) — never
-- exposed to the browser, matching vektrum-crm / crm-oeiras360's pattern.
insert into storage.buckets (id, name, public)
values ('outreach-templates', 'outreach-templates', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('battlesheet', 'battlesheet', false)
on conflict (id) do nothing;
;
