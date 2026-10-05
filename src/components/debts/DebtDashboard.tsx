"use client";

import { Loader2, Plus, RotateCw, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toaster, useToasts } from "@/components/ui/Toast";
import { useDebts, type Debt } from "@/hooks/useDebts";
import type { DebtQuery } from "@/lib/validations/debt";
import { DebtFilters } from "./DebtFilters";
import type { DebtAction } from "./DebtItem";
import { DebtList } from "./DebtList";
import { SummaryCards, SummaryCardsSkeleton } from "./SummaryCards";

const DEFAULT_FILTERS: DebtQuery = { status: "all", type: "all" };

/** null = closed, "new" = create form, Debt = edit form. */
type FormTarget = "new" | Debt | null;

export function DebtDashboard() {
  const [filters, setFilters] = useState<DebtQuery>(DEFAULT_FILTERS);
  const { debts, summary, isLoading, error, refetch, toggleSettled, deleteDebt, pendingIds } =
    useDebts(filters);
  const { toasts, showToast, dismissToast } = useToasts();
  const [busyActions, setBusyActions] = useState<Partial<Record<string, DebtAction>>>({});
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  // DebtForm (next step) will open from this state.
  const [, setFormTarget] = useState<FormTarget>(null);

  const isFiltered = filters.status !== "all" || filters.type !== "all";

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

  function handleConfirmDelete() {
    const debt = deleteTarget;
    setDeleteTarget(null);
    if (debt) void runAction(debt, "delete", () => deleteDebt(debt.id), "Catatannya udah dihapus");
  }

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-5 sm:pb-12">
        {summary ? <SummaryCards summary={summary} /> : !error && <SummaryCardsSkeleton />}

        <section aria-labelledby="debt-list-title" className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="debt-list-title" className="text-lg font-semibold text-stone-900">
              Catatan
            </h2>
            <button
              type="button"
              onClick={() => setFormTarget("new")}
              className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-emerald-700 pl-5 pr-6 font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-800 active:scale-95 sm:static sm:h-10 sm:rounded-xl sm:pl-3 sm:pr-4 sm:text-sm sm:shadow-sm"
            >
              <Plus className="size-5 sm:size-4" aria-hidden />
              Catat baru
            </button>
          </div>

          <DebtFilters value={filters} onChange={setFilters} />

          <div className="mt-4">
            {error && !isLoading ? (
              <ErrorState message={error} onRetry={refetch} />
            ) : (
              <DebtList
                debts={debts}
                isLoading={isLoading}
                isFiltered={isFiltered}
                pendingIds={pendingIds}
                busyActions={busyActions}
                onToggleSettled={handleToggleSettled}
                onEdit={setFormTarget}
                onDelete={setDeleteTarget}
                onResetFilters={() => setFilters(DEFAULT_FILTERS)}
                onCreate={() => setFormTarget("new")}
              />
            )}
          </div>
        </section>
      </main>

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
        className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 transition hover:bg-rose-100 active:scale-[0.97] disabled:opacity-60"
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
