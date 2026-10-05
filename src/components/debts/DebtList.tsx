"use client";

import { Inbox, Plus, SearchX } from "lucide-react";
import type { Debt } from "@/hooks/useDebts";
import { groupByPerson } from "@/lib/debts";
import { DebtGroupList } from "./DebtGroupList";
import { DebtItem, type DebtAction } from "./DebtItem";
import type { DebtView } from "./ViewToggle";

type DebtListProps = {
  debts: Debt[];
  view: DebtView;
  isLoading: boolean;
  isFiltered: boolean;
  pendingIds: ReadonlySet<string>;
  busyActions: Partial<Record<string, DebtAction>>;
  onToggleSettled: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
  onResetFilters: () => void;
  onCreate: () => void;
};

export function DebtList({
  debts,
  view,
  isLoading,
  isFiltered,
  pendingIds,
  busyActions,
  onToggleSettled,
  onEdit,
  onDelete,
  onResetFilters,
  onCreate,
}: DebtListProps) {
  if (isLoading) return <DebtListSkeleton />;

  if (debts.length === 0) {
    return isFiltered ? (
      <EmptyState
        icon={<SearchX className="size-7" aria-hidden />}
        message="Nggak ada yang cocok sama filter ini"
        actionLabel="Reset filter"
        onAction={onResetFilters}
      />
    ) : (
      <EmptyState
        icon={<Inbox className="size-7" aria-hidden />}
        message="Belum ada catatan. Yuk catat yang pertama!"
        actionLabel="Catat baru"
        actionIcon={<Plus className="size-4" aria-hidden />}
        onAction={onCreate}
      />
    );
  }

  const renderItem = (debt: Debt) => (
    <DebtItem
      key={debt.id}
      debt={debt}
      isBusy={pendingIds.has(debt.id)}
      busyAction={busyActions[debt.id]}
      onToggleSettled={onToggleSettled}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );

  if (view === "person") {
    return <DebtGroupList groups={groupByPerson(debts)} renderItem={renderItem} />;
  }

  return <ul className="flex flex-col gap-3">{debts.map(renderItem)}</ul>;
}

type EmptyStateProps = {
  icon: React.ReactNode;
  message: string;
  actionLabel: string;
  actionIcon?: React.ReactNode;
  onAction: () => void;
};

function EmptyState({ icon, message, actionLabel, actionIcon, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-stone-100 text-stone-400">
        {icon}
      </div>
      <p className="mt-4 max-w-56 font-medium text-stone-700">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 active:scale-[0.97]"
      >
        {actionIcon}
        {actionLabel}
      </button>
    </div>
  );
}

function DebtListSkeleton() {
  return (
    <ul aria-hidden className="flex animate-pulse flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className="rounded-3xl border border-stone-200 bg-white p-4">
          <div className="flex justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 rounded bg-stone-200" />
              <div className="h-4 w-40 rounded-full bg-stone-100" />
            </div>
            <div className="h-5 w-24 rounded bg-stone-200" />
          </div>
          <div className="mt-4 h-3.5 w-36 rounded bg-stone-100" />
          <div className="mt-4 flex gap-2 border-t border-stone-100 pt-3">
            <div className="h-11 flex-1 rounded-xl bg-stone-100" />
            <div className="h-11 flex-1 rounded-xl bg-stone-100" />
            <div className="h-11 flex-1 rounded-xl bg-stone-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}
