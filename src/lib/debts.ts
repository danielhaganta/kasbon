import type { Debt } from "@/hooks/useDebts";

export type SortOption = "newest" | "oldest" | "amount_desc" | "amount_asc";

export type PersonGroup = {
  /** normalizeName() of the name; stable across refetches. */
  key: string;
  /** Display name, taken from the first entry in the group. */
  name: string;
  debts: Debt[];
  total: number;
  owedToMe: number;
  iOwe: number;
};

/** "  Budi   Santoso " and "budi santoso" compare equal. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}

/** Case-insensitive substring match on the counterpart name. Empty query keeps everything. */
export function searchDebts(debts: readonly Debt[], query: string): Debt[] {
  const needle = normalizeName(query);
  if (!needle) return [...debts];
  return debts.filter((debt) => normalizeName(debt.counterpart_name).includes(needle));
}

const COMPARATORS: Record<SortOption, (a: Debt, b: Debt) => number> = {
  newest: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  oldest: (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  amount_desc: (a, b) => b.amount - a.amount,
  amount_asc: (a, b) => a.amount - b.amount,
};

/** Returns a new array; ties keep their incoming order (Array#sort is stable). */
export function sortDebts(debts: readonly Debt[], sort: SortOption): Debt[] {
  return [...debts].sort(COMPARATORS[sort]);
}

/**
 * Groups by normalized name. Groups appear in the order of their first entry,
 * so an already-sorted list yields sorted groups with sorted entries inside.
 */
export function groupByPerson(debts: readonly Debt[]): PersonGroup[] {
  const groups = new Map<string, PersonGroup>();
  for (const debt of debts) {
    const key = normalizeName(debt.counterpart_name);
    const group = groups.get(key) ?? {
      key,
      name: debt.counterpart_name.trim(),
      debts: [],
      total: 0,
      owedToMe: 0,
      iOwe: 0,
    };
    groups.set(key, {
      ...group,
      debts: [...group.debts, debt],
      total: group.total + debt.amount,
      owedToMe: group.owedToMe + (debt.type === "owed_to_me" ? debt.amount : 0),
      iOwe: group.iOwe + (debt.type === "i_owe" ? debt.amount : 0),
    });
  }
  return [...groups.values()];
}
