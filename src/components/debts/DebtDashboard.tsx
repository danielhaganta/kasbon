"use client";

import { Loader2, Plus, RotateCw, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toaster, useToasts } from "@/components/ui/Toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDebts, type Debt } from "@/hooks/useDebts";
import { searchDebts, sortDebts, type SortOption } from "@/lib/debts";
import type { DebtInput, DebtQuery } from "@/lib/validations/debt";
import { DebtFilters } from "./DebtFilters";
import { DebtFormModal } from "./DebtFormModal";
import type { DebtAction } from "./DebtItem";
import { DebtList } from "./DebtList";
import { SummaryCards, SummaryCardsSkeleton } from "./SummaryCards";
import { ViewToggle, type DebtView } from "./ViewToggle";

const DEFAULT_FILTERS: DebtQuery = { status: "all", type: "all" };
const SEARCH_DEBOUNCE_MS = 200;

/** null = closed, "new" = create form, Debt = edit form. */
type FormTarget = "new" | Debt | null;

export function DebtDashboard() {
  const [filters, setFilters] = useState<DebtQuery>(DEFAULT_FILTERS);
  const {
    debts,
    summary,
    isLoading,
    error,
    refetch,
    createDebt,
    updateDebt,
    toggleSettled,
    deleteDebt,
    pendingIds,
  } = useDebts(filters);
  const { toasts, showToast, dismissToast } = useToasts();
  const [busyActions, setBusyActions] = useState<Partial<Record<string, DebtAction>>>({});
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [view, setView] = useState<DebtView>("entry");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  // Search and sort run on the fetched list; status/type filtering stays on the server.
  const visibleDebts = useMemo(
    () => sortDebts(searchDebts(debts, debouncedSearch), sort),
    [debts, debouncedSearch, sort],
  );

  const isFiltered =
    filters.status !== "all" || filters.type !== "all" || debouncedSearch.trim() !== "";

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
  }

  async function runAction(
    debt: Debt,
    action: DebtAction,
    run: () => Promise<unknown>,
    successMessage: string,
  ) {
    setBusyActions((prev) => ({ ...prev, [debt.id]: action }));
    try {
      await run();
      showToast("success", successMessage);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Ada masalah, coba lagi ya");
    } finally {
      setBusyActions((prev) => ({ ...prev, [debt.id]: undefined }));
    }
  }

  function handleToggleSettled(debt: Debt) {
    const settling = debt.settled_at === null;
    void runAction(
      debt,
      "settle",
      () => toggleSettled(debt),
      settling ? "Sip, udah ditandai lunas" : "Oke, status lunasnya dibatalin",
    );
  }

  async function handleSave(input: DebtInput) {
    if (formTarget === "new") await createDebt(input);
    else if (formTarget) await updateDebt(formTarget.id, input);
    setFormTarget(null);
    showToast("success", "Catatan tersimpan");
  }

  function handleConfirmDelete() {
    const debt = deleteTarget;
    setDeleteTarget(null);
    if (debt) void runAction(debt, "delete", () => deleteDebt(debt.id), "Catatannya udah dihapus");
  }

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-5 pb-[calc(3.5rem+2.5rem+env(safe-area-inset-bottom))] sm:pb-12">
        {summary ? <SummaryCards summary={summary} /> : !error && <SummaryCardsSkeleton />}

        <section aria-labelledby="debt-list-title" className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="debt-list-title" className="text-lg font-semibold text-stone-900">
              Catatan
            </h2>
            <div className="flex items-center gap-2">
              <ViewToggle value={view} onChange={setView} />
              <button
                type="button"
                onClick={() => setFormTarget("new")}
                className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-emerald-700 pl-5 pr-6 font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-800 active:scale-95 sm:static sm:h-11 sm:rounded-xl sm:pl-3 sm:pr-4 sm:text-sm sm:shadow-sm"
              >
                <Plus className="size-5 sm:size-4" aria-hidden />
                Catat baru
              </button>
            </div>
          </div>

          <DebtFilters
            filters={filters}
            onFiltersChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            sort={sort}
            onSortChange={setSort}
          />

          <div className="mt-4">
            {error && !isLoading ? (
              <ErrorState message={error} onRetry={refetch} />
            ) : (
              <DebtList
                debts={visibleDebts}
                view={view}
                isLoading={isLoading}
                isFiltered={isFiltered}
                pendingIds={pendingIds}
                busyActions={busyActions}
                onToggleSettled={handleToggleSettled}
                onEdit={setFormTarget}
                onDelete={setDeleteTarget}
                onResetFilters={resetFilters}
                onCreate={() => setFormTarget("new")}
              />
            )}
          </div>
        </section>
      </main>

      {formTarget && (
        <DebtFormModal
          key={formTarget === "new" ? "new" : formTarget.id}
          debt={formTarget === "new" ? undefined : formTarget}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
        />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Yakin mau hapus catatan ini?"
        description={
          deleteTarget
            ? `Catatan "${deleteTarget.counterpart_name}" bakal hilang permanen, nggak bisa dibalikin.`
            : undefined
        }
        confirmLabel="Ya, hapus"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  const [isRetrying, setIsRetrying] = useState(false);

  async function retry() {
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  }

  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center"
    >
      <TriangleAlert className="size-8 text-rose-500" aria-hidden />
      <p className="mt-3 font-medium text-rose-900">{message}</p>
      <button
        type="button"
        onClick={retry}
        disabled={isRetrying}
        className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 transition hover:bg-rose-100 active:scale-[0.97] disabled:opacity-60"
      >
        {isRetrying ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <RotateCw className="size-4" aria-hidden />
        )}
        Coba lagi
      </button>
    </div>
  );
}
