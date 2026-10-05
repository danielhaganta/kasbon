// Run: npm run test:rls
//
// Hits the Supabase REST API directly (no Next.js in between) to prove RLS
// isolates users. Needs two existing, email-confirmed test accounts:
//   TEST_A_EMAIL, TEST_A_PASSWORD, TEST_B_EMAIL, TEST_B_PASSWORD
// plus NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, all in .env.local.
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: fall back to variables already in the environment.
}

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "TEST_A_EMAIL",
  "TEST_A_PASSWORD",
  "TEST_B_EMAIL",
  "TEST_B_PASSWORD",
];
const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Env belum lengkap, isi dulu di .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

const env = process.env;
const TEST_NOTE = "test-rls (aman dihapus)";
const results = [];

function newClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function report(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

function describe(error) {
  return error ? `${error.code ?? "?"}: ${error.message}` : "no error";
}

// Reference totals from rows the client can see itself (test accounts stay far below 1000 rows).
async function ownUnsettledTotals(client) {
  const { data, error } = await client.from("debts").select("type, amount").is("settled_at", null);
  if (error) throw new Error(`Select pembanding gagal: ${describe(error)}`);
  return data.reduce(
    (totals, debt) => ({ ...totals, [debt.type]: totals[debt.type] + debt.amount }),
    { owed_to_me: 0, i_owe: 0 },
  );
}

async function rpcSummary(client) {
  const { data, error } = await client.rpc("get_debt_summary").single();
  if (error) throw new Error(`rpc get_debt_summary gagal: ${describe(error)}`);
  return data;
}

const sameTotals = (x, y) => x.owed_to_me === y.owed_to_me && x.i_owe === y.i_owe;
const showTotals = (t) => `owed_to_me=${t.owed_to_me}, i_owe=${t.i_owe}`;

async function signIn(label, email, password) {
  const client = newClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`Login ${label} gagal: ${describe(error)}`);
  return { client, userId: data.user.id };
}

const anon = newClient();
let a;
let b;
const createdIds = [];

try {
  // a. Anonymous select: anon has no table privileges, so expect an error or zero rows.
  {
    const { data, error } = await anon.from("debts").select("id").limit(1);
    report(
      "a. Tanpa login: select debts kosong/ditolak",
      Boolean(error) || data.length === 0,
      error ? describe(error) : `${data.length} baris`,
    );
  }
  {
    const { data, error } = await anon.rpc("get_debt_summary");
    report(
      "a. Tanpa login: rpc get_debt_summary ditolak",
      // 42501 specifically: "function not found" must not count as a pass.
      error?.code === "42501",
      error ? describe(error) : `LOLOS: ${JSON.stringify(data)}`,
    );
  }

  // b. Two distinct users.
  a = await signIn("A", env.TEST_A_EMAIL, env.TEST_A_PASSWORD);
  b = await signIn("B", env.TEST_B_EMAIL, env.TEST_B_PASSWORD);
  report("b. Login user A & B (beda user)", a.userId !== b.userId);
  if (a.userId === b.userId) throw new Error("TEST_A dan TEST_B harus akun yang berbeda");

  // c. A creates a row; B must not be able to read, change or delete it.
  const { data: row, error: insertError } = await a.client
    .from("debts")
    .insert({ type: "i_owe", counterpart_name: "RLS Test", amount: 12345, note: TEST_NOTE })
    .select()
    .single();
  report("c. A insert entry", !insertError && row?.user_id === a.userId, describe(insertError));
  if (insertError) throw new Error("Insert A gagal, skenario berikutnya nggak bisa jalan");
  createdIds.push(row.id);

  {
    const { data, error } = await b.client.from("debts").select("id").eq("id", row.id);
    report("c. B select entry A → 0 baris", Boolean(error) || data.length === 0, error ? describe(error) : `${data.length} baris`);
  }
  {
    const { data, error } = await b.client
      .from("debts")
      .update({ amount: 1, counterpart_name: "Dibajak B" })
      .eq("id", row.id)
      .select("id");
    const { data: after } = await a.client.from("debts").select("amount, counterpart_name").eq("id", row.id).single();
    const untouched = after?.amount === 12345 && after?.counterpart_name === "RLS Test";
    report(
      "c. B update entry A → 0 baris",
      (Boolean(error) || data.length === 0) && untouched,
      `${error ? describe(error) : `${data.length} baris`}, data A ${untouched ? "utuh" : "BERUBAH"}`,
    );
  }
  {
    const { data, error } = await b.client.from("debts").delete().eq("id", row.id).select("id");
    const { data: still } = await a.client.from("debts").select("id").eq("id", row.id);
    const survived = still?.length === 1;
    report(
      "c. B delete entry A → 0 baris",
      (Boolean(error) || data.length === 0) && survived,
      `${error ? describe(error) : `${data.length} baris`}, entry A ${survived ? "masih ada" : "HILANG"}`,
    );
  }

  // c. Summary RPC is security invoker, so each caller only sums their own rows.
  {
    const [aRpc, aOwn] = [await rpcSummary(a.client), await ownUnsettledTotals(a.client)];
    report(
      "c. rpc A = total data A sendiri (termasuk entry tes)",
      sameTotals(aRpc, aOwn) && aRpc.i_owe >= 12345,
      `rpc ${showTotals(aRpc)} | select ${showTotals(aOwn)}`,
    );
    const [bRpc, bOwn] = [await rpcSummary(b.client), await ownUnsettledTotals(b.client)];
    report(
      "c. rpc B nggak ikut ngitung data A",
      sameTotals(bRpc, bOwn),
      `rpc ${showTotals(bRpc)} | select ${showTotals(bOwn)}`,
    );
  }

  // d. B forges user_id = A; WITH CHECK must reject it.
  {
    const { data, error } = await b.client
      .from("debts")
      .insert({ type: "owed_to_me", counterpart_name: "RLS Spoof", amount: 1, note: TEST_NOTE, user_id: a.userId })
      .select("id")
      .maybeSingle();
    if (data?.id) createdIds.push(data.id);
    report(
      "d. B insert dengan user_id A → error RLS",
      error?.code === "42501",
      error ? describe(error) : "MASUK, harusnya ditolak",
    );
  }
} catch (err) {
  report("Skenario terhenti", false, err instanceof Error ? err.message : String(err));
} finally {
  // e. Cleanup via A, who owns every row this script could have created.
  if (a && createdIds.length > 0) {
    const { data, error } = await a.client.from("debts").delete().in("id", createdIds).select("id");
    report(
      "e. Bersihkan data tes",
      !error && data.length === createdIds.length,
      error ? describe(error) : `${data.length}/${createdIds.length} baris dihapus`,
    );
  }
  await Promise.all([a?.client.auth.signOut(), b?.client.auth.signOut()]);
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} PASS`);
process.exit(failed > 0 ? 1 : 0);
