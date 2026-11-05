// RLS check (Milestone 2 DoD): without signing in, the browser key must not be able
// to read or change agent data. Runs against the Development project from .env.
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

for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.note ? ` (${r.note})` : ""}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll RLS checks passed");
process.exit(failed ? 1 : 0);
