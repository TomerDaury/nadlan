// Runs Supabase CLI database commands against the Development database only.
// Usage (via npm scripts, which load .env with `node --env-file=.env`):
//   node scripts/db.mjs push         -> apply new migrations
//   node scripts/db.mjs seed         -> apply new migrations + supabase/seed.sql
//   node scripts/db.mjs list         -> show which migrations were applied
import { spawnSync } from "node:child_process";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("SUPABASE_DB_URL is missing in .env (Development connection string, Session Pooler).");
  process.exit(1);
}

const commands = {
  push: ["db", "push", `--remote=${dbUrl}`],
  seed: ["db", "push", "--include-seed", `--remote=${dbUrl}`],
  list: ["migration", "list", `--remote=${dbUrl}`],
};

const base = commands[process.argv[2]];
if (!base) {
  console.error("Usage: node scripts/db.mjs <push|seed|list> [--yes]");
  process.exit(1);
}
// Extra flags (e.g. --yes to confirm applying migrations) are passed through to the CLI.
const args = [...base, ...process.argv.slice(3)];

// Pass args without a shell so the URL (which contains a password) is not re-parsed.
const result = spawnSync(process.execPath, ["node_modules/supabase/dist/supabase.js", ...args], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
