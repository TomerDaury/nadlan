-- The signed-in agent may delete a client request (PRD F9, ADR-12).
-- request_matches rows go with it through ON DELETE CASCADE, which does not check RLS,
-- so no delete policy is needed there. Still no insert/update policies for the agent.

create policy "admin can delete client_requests"
  on public.client_requests
  for delete
  to authenticated
  using ((select public.is_admin()));
