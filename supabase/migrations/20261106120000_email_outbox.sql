-- Email outbox (PRD F4, F6; ARCHITECTURE §2.4, §2.6). One row per email to send.
-- No RLS policies: reachable only from the server with the secret key (ADR-11).
-- Rows go away with their request (ON DELETE CASCADE), so a deleted request gets no more email.

create type public.email_kind as enum ('results', 'new_property');
create type public.email_status as enum ('pending', 'sent', 'failed');

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.client_requests (id) on delete cascade,
  kind public.email_kind not null,
  property_id uuid references public.properties (id) on delete set null,
  status public.email_status not null default 'pending',
  attempts smallint not null default 0 check (attempts between 0 and 5),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index email_outbox_status_idx on public.email_outbox (status, created_at);
create index email_outbox_request_idx on public.email_outbox (request_id);

alter table public.email_outbox enable row level security;
