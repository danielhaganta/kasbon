// Run: npm run check:format
import assert from "node:assert/strict";
import { formatRelativeDate, formatRupiah, todayLocalISO } from "../src/lib/format.ts";

const now = new Date(2026, 9, 6, 15, 30); // 6 Okt 2026, 15:30 local

const rupiah = [
  [1234000, "Rp 1.234.000"],
  [-50000, "-Rp 50.000"],
  [0, "Rp 0"],
];

const relative = [
  ["2026-10-06", "hari ini"],
  ["2026-10-05", "kemarin"],
  ["2026-10-03", "3 hari lalu"],
  ["2026-09-26", "1 minggu lalu"], // 10 days ago
  ["2026-10-07", "besok"],
  ["2026-10-09", "3 hari lagi"],
  ["2026-09-30", "6 hari lalu"],
  ["2026-09-29", "1 minggu lalu"],
  ["2026-09-07", "4 minggu lalu"],
  ["2026-09-06", "1 bulan lalu"],
  ["2025-10-07", "12 bulan lalu"],
  ["2025-10-06", "1 tahun lalu"],
  // ISO timestamp late on 5 Okt local time -> still "kemarin"
  [new Date(2026, 9, 5, 23, 30).toISOString(), "kemarin"],
];

console.log("formatRupiah");
for (const [input, expected] of rupiah) {
  const actual = formatRupiah(input);
  console.log(`  ${String(input).padEnd(30)} -> ${actual}`);
  assert.equal(actual, expected);
}

console.log("formatRelativeDate (now = 2026-10-06)");
for (const [input, expected] of relative) {
  const actual = formatRelativeDate(input, now);
  console.log(`  ${input.padEnd(30)} -> ${actual}`);
  assert.equal(actual, expected);
}

assert.match(todayLocalISO(), /^\d{4}-\d{2}-\d{2}$/);
console.log(`todayLocalISO() -> ${todayLocalISO()}`);
console.log("all format checks passed");
