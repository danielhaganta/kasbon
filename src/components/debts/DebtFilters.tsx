"use client";

import { ChevronDown, Search, X } from "lucide-react";
import type { SortOption } from "@/lib/debts";
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

const SORT_OPTIONS: Option<SortOption>[] = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "amount_desc", label: "Jumlah terbesar" },
  { value: "amount_asc", label: "Jumlah terkecil" },
];

type DebtFiltersProps = {
  filters: DebtQuery;
  onFiltersChange: (filters: DebtQuery) => void;
  search: string;
  onSearchChange: (search: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
};

export function DebtFilters({
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: DebtFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label htmlFor="debt-search" className="sr-only">
          Cari nama orang
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <input
          id="debt-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Cari nama orang..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          // 16px on mobile so iOS Safari doesn't zoom in on focus.
          className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-11 text-base text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Hapus pencarian"
            className="absolute right-0 top-0 grid size-11 place-items-center rounded-xl text-stone-400 transition hover:text-stone-700 active:scale-95"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <FilterSelect
          label="Status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(status) => onFiltersChange({ ...filters, status })}
        />
        <FilterSelect
          label="Tipe"
          options={TYPE_OPTIONS}
          value={filters.type}
          onChange={(type) => onFiltersChange({ ...filters, type })}
        />
        <FilterSelect
          label="Urutkan"
          options={SORT_OPTIONS}
          value={sort}
          onChange={onSortChange}
          className="col-span-2 sm:col-span-1"
        />
      </div>
    </div>
  );
}

type FilterSelectProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

function FilterSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  className = "",
}: FilterSelectProps<T>) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-stone-500">{label}</span>
      {/* block + w-full so the absolute chevron anchors to the select's right edge, not the text. */}
      <span className="relative block w-full">
        <select
          value={value}
          onChange={(event) => {
            const option = options.find((o) => o.value === event.target.value);
            if (option) onChange(option.value);
          }}
          className="block h-11 w-full cursor-pointer appearance-none rounded-xl border border-stone-200 bg-white pl-3.5 pr-10 text-base font-medium text-stone-800 shadow-sm outline-none transition hover:border-stone-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 sm:text-sm"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
      </span>
    </label>
  );
}
