// RLS check (Milestones 2–3 DoD): without signing in, the browser key must not be able
// to read or change agent or client data. Runs against the Development project from .env.
// Usage: npm run check:rls
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

// Anonymous client: exactly what any visitor's browser has.
const supabase = createClient(url, key, { auth: { persistSession: false } });
const results = [];

async function check(name, run) {
  try {
    const ok = await run();
    results.push({ name, ok });
  } catch (error) {
    results.push({ name, ok: false, note: String(error) });
  }
}

const noRows = ({ data, error }) => Boolean(error) || (Array.isArray(data) && data.length === 0);

await check("anon cannot read properties", async () => noRows(await supabase.from("properties").select("id")));
await check("anon cannot read property_images", async () =>
  noRows(await supabase.from("property_images").select("id"))
);
await check("anon cannot read admin_users", async () => noRows(await supabase.from("admin_users").select("email")));
await check("anon cannot read available_areas view", async () =>
  noRows(await supabase.from("available_areas").select("city"))
);
await check("anon cannot insert a property", async () => {
  const { error } = await supabase
    .from("properties")
    .insert({ title: "rls-test", city: "x", neighborhood: "x", price: 1, rooms: 1, status: "available" });
  return Boolean(error);
});
await check("anon cannot update properties", async () => {
  const { data, error } = await supabase
    .from("properties")
    .update({ title: "hacked" })
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id");
  return Boolean(error) || (data ?? []).length === 0;
});
await check("anon cannot delete properties", async () => {
  const { data, error } = await supabase
    .from("properties")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id");
  return Boolean(error) || (data ?? []).length === 0;
});
await check("anon cannot call is_admin()", async () => {
  const { data, error } = await supabase.rpc("is_admin");
  return Boolean(error) || data === false;
});
await check("anon cannot upload to property-images", async () => {
  const { error } = await supabase.storage
    .from("property-images")
    .upload(`properties/rls-test-${Date.now()}.png`, new Blob(["x"], { type: "image/png" }), {
      contentType: "image/png",
    });
  return Boolean(error);
});

// Client tables (Milestone 3): server-only, so the browser key gets nothing at all.
for (const table of ["client_requests", "request_matches", "submission_log"]) {
  await check(`anon cannot read ${table}`, async () => noRows(await supabase.from(table).select("id")));
}
await check("anon cannot insert a client request", async () => {
  const { error } = await supabase.from("client_requests").insert({
    submission_id: crypto.randomUUID(),
    name: "rls-test",
    email: "rls@test.local",
    city: "x",
    neighborhoods: ["x"],
    max_budget: 1,
    rooms_min: 1,
    rooms_max: 1,
    preferences_text: "x",
    access_token_hash: `rls-test-${Date.now()}`,
  });
  return Boolean(error);
});
await check("anon cannot insert into submission_log", async () => {
  const { error } = await supabase.from("submission_log").insert({ ip_hash: "rls-test" });
  return Boolean(error);
});
await check("anon cannot update client_requests", async () => {
  const { data, error } = await supabase
    .from("client_requests")
    .update({ notifications_active: false })
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id");
  return Boolean(error) || (data ?? []).length === 0;
});
await check("anon cannot delete client_requests", async () => {
  const { data, error } = await supabase
    .from("client_requests")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id");
  return Boolean(error) || (data ?? []).length === 0;
});
// Milestone 4: the agent got read-only policies on these; anon must still get nothing.
await check("anon cannot insert into request_matches", async () => {
  const { error } = await supabase
    .from("request_matches")
    .insert({ request_id: "00000000-0000-0000-0000-000000000000", source: "initial", rank: 1 });
  return Boolean(error);
});
await check("anon cannot update request_matches", async () => {
  const { data, error } = await supabase
    .from("request_matches")
    .update({ reason: "hacked" })
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id");
  return Boolean(error) || (data ?? []).length === 0;
});
await check("anon cannot delete request_matches", async () => {
  const { data, error } = await supabase
    .from("request_matches")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id");
  return Boolean(error) || (data ?? []).length === 0;
});

for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.note ? ` (${r.note})` : ""}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll RLS checks passed");
process.exit(failed ? 1 : 0);
