"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DebtInput, DebtQuery, DebtUpdate } from "@/lib/validations/debt";
import type { Tables } from "@/types/database";

export type Debt = Tables<"debts">;
export type DebtSummary = { owedToMe: number; iOwe: number; net: number };
type DebtsResponse = { data: Debt[]; summary: DebtSummary };
type DebtResponse = { data: Debt };

/** Key in `pendingIds` while a new debt is being created. */
export const CREATE_KEY = "create";
const FALLBACK_ERROR = "Ada masalah, coba lagi ya";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : FALLBACK_ERROR;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : FALLBACK_ERROR;
    throw new Error(message);
  }
  // Trusted: shape comes from our own /api/debts handlers.
  return body as T;
}

export function useDebts(filters: DebtQuery) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  // Filters whose result is on screen; differs from `query` while new filters load.
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  // Only the latest request may write state, so a slow old response can't overwrite new filters.
  const latestRequest = useRef(0);

  const query = new URLSearchParams(filters).toString();

  const refetch = useCallback((): Promise<void> => {
    const requestId = ++latestRequest.current;
    return request<DebtsResponse>(`/api/debts?${query}`).then(
      (result) => {
        if (requestId !== latestRequest.current) return;
        setDebts(result.data);
        setSummary(result.summary);
        setError(null);
        setLoadedQuery(query);
      },
      (err: unknown) => {
        if (requestId !== latestRequest.current) return;
        setError(errorMessage(err));
        setLoadedQuery(query);
      },
    );
  }, [query]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const mutate = useCallback(
    async <T,>(key: string, action: () => Promise<T>): Promise<T> => {
      setPendingIds((prev) => new Set(prev).add(key));
      try {
        const result = await action();
        await refetch();
        return result;
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [refetch],
  );

  const createDebt = useCallback(
    (input: DebtInput) =>
      mutate(CREATE_KEY, async () => {
        const { data } = await request<DebtResponse>("/api/debts", {
          method: "POST",
          body: JSON.stringify(input),
        });
        return data;
      }),
    [mutate],
  );

  const updateDebt = useCallback(
    (id: string, changes: DebtUpdate) =>
      mutate(id, async () => {
        const { data } = await request<DebtResponse>(`/api/debts/${id}`, {
          method: "PATCH",
          body: JSON.stringify(changes),
        });
        return data;
      }),
    [mutate],
  );

  // Sends the explicit target state (not "flip"), so a double tap can't undo itself.
  const toggleSettled = useCallback(
    (debt: Pick<Debt, "id" | "settled_at">) =>
      updateDebt(debt.id, { settled: debt.settled_at === null }),
    [updateDebt],
  );

  const deleteDebt = useCallback(
    (id: string) =>
      mutate(id, async () => {
        await request<{ success: true }>(`/api/debts/${id}`, { method: "DELETE" });
      }),
    [mutate],
  );

  return {
    debts,
    summary,
    isLoading: loadedQuery !== query,
    error,
    refetch,
    createDebt,
    updateDebt,
    toggleSettled,
    deleteDebt,
    pendingIds,
    isCreating: pendingIds.has(CREATE_KEY),
  };
}
