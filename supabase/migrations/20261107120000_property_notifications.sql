-- New property notifications (PRD F6, ARCHITECTURE §2.6 B, ADR-17).
-- For one new property and the requests it matches, creates in ONE transaction:
--   * a request_matches row (source = 'notification') per request, and
--   * an email_outbox row (kind = 'new_property') only for matches that were really created.
-- The partial unique index request_matches_one_notification_idx makes a second run a no-op,
-- so the same property is never sent twice to the same request.
-- Server only: callable with the secret key (service_role), never from the browser.

create function public.record_property_notifications(p_property_id uuid, p_request_ids uuid[])
returns setof uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  with property as (
    select id, title
    from public.properties
    where id = p_property_id and status = 'available'
  ),
  new_matches as (
    insert into public.request_matches (request_id, property_id, property_title_snapshot, source)
    select r.id, p.id, p.title, 'notification'
    from public.client_requests r
    cross join property p
    -- Re-checked inside the transaction: a request that stopped updates gets nothing.
    where r.id = any(p_request_ids) and r.notifications_active
    on conflict (request_id, property_id) where source = 'notification' do nothing
    returning request_id
  )
  insert into public.email_outbox (request_id, kind, property_id)
  select m.request_id, 'new_property', p_property_id
  from new_matches m
  returning id;
$$;

revoke all on function public.record_property_notifications(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.record_property_notifications(uuid, uuid[]) to service_role;
