// Run: npm run check:debts
import assert from "node:assert/strict";
import { groupByPerson, normalizeName, searchDebts, sortDebts } from "../src/lib/debts.ts";

const debt = (id, name, amount, type, created_at) => ({
  id,
  counterpart_name: name,
  amount,
  type,
  created_at,
  updated_at: created_at,
  due_date: null,
  note: null,
  settled_at: null,
  user_id: "u1",
});

const debts = [
  debt("a", "Budi", 50000, "owed_to_me", "2026-10-05T10:00:00+00:00"),
  debt("b", "  budi  ", 20000, "i_owe", "2026-10-01T10:00:00+00:00"),
  debt("c", "Sari Dewi", 150000, "owed_to_me", "2026-10-03T10:00:00+00:00"),
  debt("d", "BUDI", 30000, "owed_to_me", "2026-10-06T10:00:00+00:00"),
];
const ids = (list) => list.map((d) => d.id).join("");

assert.equal(normalizeName("  Sari   Dewi "), "sari dewi");

assert.equal(ids(searchDebts(debts, "BUD")), "abd");
assert.equal(ids(searchDebts(debts, "sari  dewi")), "c");
assert.equal(ids(searchDebts(debts, "   ")), "abcd");
assert.equal(ids(searchDebts(debts, "zzz")), "");

assert.equal(ids(sortDebts(debts, "newest")), "dacb");
assert.equal(ids(sortDebts(debts, "oldest")), "bcad");
assert.equal(ids(sortDebts(debts, "amount_desc")), "cadb");
assert.equal(ids(sortDebts(debts, "amount_asc")), "bdac");
assert.equal(ids(debts), "abcd", "input must not be mutated");

const groups = groupByPerson(sortDebts(debts, "newest"));
assert.equal(groups.length, 2);
assert.deepEqual(
  groups.map((g) => [g.key, g.name, ids(g.debts), g.total, g.owedToMe, g.iOwe]),
  [
    ["budi", "BUDI", "dab", 100000, 80000, 20000],
    ["sari dewi", "Sari Dewi", "c", 150000, 150000, 0],
  ],
);
assert.deepEqual(groupByPerson([]), []);

console.log("all debts checks passed");
