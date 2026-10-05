"use client";

import { ChevronDown } from "lucide-react";
import type { DebtQuery } from "@/lib/validations/debt";
import { DEBT_TYPE_LABELS } from "./labels";

type Option<T extends string> = { value: T; label: string };

const STATUS_OPTIONS: Option<DebtQuery["status"]>[] = [
  { value: "all", label: "Semua" },
  { value: "unsettled", label: "Belum lunas" },
  { value: "settled", label: "Lunas" },
];

const TYPE_OPTIONS: Option<DebtQuery["type"]>[] = [
  { value: "all", label: "Semua" },
  { value: "owed_to_me", label: DEBT_TYPE_LABELS.owed_to_me },
  { value: "i_owe", label: DEBT_TYPE_LABELS.i_owe },
];

type DebtFiltersProps = {
  value: DebtQuery;
  onChange: (filters: DebtQuery) => void;
};

export function DebtFilters({ value, onChange }: DebtFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FilterSelect
        label="Status"
        options={STATUS_OPTIONS}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
      <FilterSelect
        label="Tipe"
        options={TYPE_OPTIONS}
        value={value.type}
        onChange={(type) => onChange({ ...value, type })}
      />
    </div>
  );
}

type FilterSelectProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

function FilterSelect<T extends string>({ label, options, value, onChange }: FilterSelectProps<T>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-stone-500">{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => {
            const option = options.find((o) => o.value === event.target.value);
            if (option) onChange(option.value);
          }}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-stone-200 bg-white pl-3 pr-9 text-sm font-medium text-stone-800 shadow-sm outline-none transition hover:border-stone-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
      </span>
    </label>
  );
}
