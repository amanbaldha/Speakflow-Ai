// ─────────────────────────────────────────────────────────────────────────
// PHASE 4 STUB — not wired up yet.
//
// This file exists now (rather than being added later) so the project's
// folder structure matches the intended final architecture from day one:
// conversation agent / evaluator / recording / database stay in separate
// modules. Session history, the progress dashboard, and persisted
// recordings all land here in Phase 4.
//
// When you're ready to wire this up:
//   1. `npm install @supabase/supabase-js`
//   2. Fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
//      SUPABASE_SERVICE_ROLE_KEY in .env.local
//   3. Create the `sessions` table (see README.md → "Database schema")
//   4. Implement getSupabaseServerClient() below using
//      createClient(url, serviceRoleKey) for server-side writes (API routes
//      only — NEVER ship the service-role key to the browser), and a
//      separate anon-key client for read-only client components.
// ─────────────────────────────────────────────────────────────────────────

export function getSupabaseServerClient(): never {
  throw new Error(
    "Supabase persistence is not implemented yet — it's planned for Phase 4. " +
      "See lib/supabase/client.ts for wiring instructions."
  );
}
