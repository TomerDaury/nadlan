-- Read-only access to client requests for the signed-in agent (PRD F9, ARCHITECTURE §2.7 layer 2).
-- Only SELECT policies: the agent cannot insert, update or delete requests or matches.
-- anon still has no policies, and submission_log stays server-only.

create policy "admin can read client_requests"
  on public.client_requests
  for select
  to authenticated
  using ((select public.is_admin()));

create policy "admin can read request_matches"
  on public.request_matches
  for select
  to authenticated
  using ((select public.is_admin()));
