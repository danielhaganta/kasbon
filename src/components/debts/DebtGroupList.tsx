"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import type { Debt } from "@/hooks/useDebts";
import type { PersonGroup } from "@/lib/debts";
import { formatRupiah } from "@/lib/format";

type DebtGroupListProps = {
  groups: PersonGroup[];
  renderItem: (debt: Debt) => ReactNode;
};

export function DebtGroupList({ groups, renderItem }: DebtGroupListProps) {
  // Keyed by normalized name, so expanded groups stay open across refetches.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const baseId = useId();

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  return (
    <ul className="flex flex-col gap-3">
      {groups.map((group, index) => {
        const isOpen = expanded.has(group.key);
        const panelId = `${baseId}-${index}`;
        return (
          <li key={group.key} className="rounded-3xl border border-stone-200 bg-white shadow-sm">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(group.key)}
              className="flex min-h-16 w-full items-center gap-3 rounded-3xl p-4 text-left transition hover:bg-stone-50 active:bg-stone-100"
            >
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-full bg-stone-900 text-base font-semibold uppercase text-white"
              >
                {group.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-stone-900">{group.name}</span>
                <span className="block text-sm text-stone-500">
                  {group.debts.length} entry, total{" "}
                  <span className="font-semibold tabular-nums text-stone-900">
                    {formatRupiah(group.total)}
                  </span>
                </span>
                {group.owedToMe > 0 && group.iOwe > 0 && (
                  <span className="mt-0.5 block text-xs text-stone-400 tabular-nums">
                    Dihutang {formatRupiah(group.owedToMe)} · Saya hutang {formatRupiah(group.iOwe)}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`size-5 shrink-0 text-stone-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {/* grid-rows 0fr -> 1fr animates height; inert keeps hidden buttons out of tab order. */}
            <div
              id={panelId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <ul className="flex flex-col gap-3 border-t border-stone-100 p-3">
                  {group.debts.map(renderItem)}
                </ul>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
