"use client";

import {
  CalendarClock,
  CircleCheck,
  Clock,
  Loader2,
  Pencil,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { Debt } from "@/hooks/useDebts";
import { useIsClient } from "@/hooks/useIsClient";
import { formatRelativeDate, formatRupiah, todayLocalISO } from "@/lib/format";
import { DEBT_TYPE_LABELS } from "./labels";

export type DebtAction = "settle" | "delete";

type DebtItemProps = {
  debt: Debt;
  isBusy: boolean;
  busyAction: DebtAction | undefined;
  onToggleSettled: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
};

const TYPE_BADGE = {
  owed_to_me: "bg-sky-50 text-sky-700 ring-sky-600/15",
  i_owe: "bg-amber-50 text-amber-800 ring-amber-600/20",
};

export function DebtItem({
  debt,
  isBusy,
  busyAction,
  onToggleSettled,
  onEdit,
  onDelete,
}: DebtItemProps) {
  const isSettled = debt.settled_at !== null;

  return (
    <li
      className={`rounded-3xl border bg-white p-4 shadow-sm transition duration-200 ${
        isSettled ? "border-stone-200/70" : "border-stone-200 hover:-translate-y-0.5 hover:shadow-md"
      } ${isBusy ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-stone-900" title={debt.counterpart_name}>
            {debt.counterpart_name}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge className={TYPE_BADGE[debt.type]}>{DEBT_TYPE_LABELS[debt.type]}</Badge>
            {isSettled ? (
              <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                <CircleCheck className="size-3.5" aria-hidden />
                Lunas
              </Badge>
            ) : (
              <Badge className="bg-stone-100 text-stone-600 ring-stone-500/15">Belum lunas</Badge>
            )}
          </div>
        </div>
        <p
          className={`shrink-0 text-right text-base font-bold tabular-nums sm:text-lg ${
            isSettled ? "text-stone-400 line-through decoration-stone-300" : "text-stone-900"
          }`}
        >
          {formatRupiah(debt.amount)}
        </p>
      </div>

      <DebtDate debt={debt} />

      {debt.note && (
        <p className="mt-2 line-clamp-2 text-sm text-stone-600 [overflow-wrap:anywhere]">
          {debt.note}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
        <ActionButton
          icon={isSettled ? Undo2 : CircleCheck}
          label={isSettled ? "Batalin lunas" : "Tandai lunas"}
          tone={isSettled ? "neutral" : "primary"}
          disabled={isBusy}
          loading={busyAction === "settle"}
          onClick={() => onToggleSettled(debt)}
        />
        <ActionButton
          icon={Pencil}
          label="Edit"
          tone="neutral"
          disabled={isBusy}
          onClick={() => onEdit(debt)}
        />
        <ActionButton
          icon={Trash2}
          label="Hapus"
          tone="danger"
          disabled={isBusy}
          loading={busyAction === "delete"}
          onClick={() => onDelete(debt)}
        />
      </div>
    </li>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

// Relative dates depend on the viewer's clock and timezone, so render them only on the client.
function DebtDate({ debt }: { debt: Debt }) {
  const isClient = useIsClient();
  const dueDate = debt.due_date;
  const isOverdue =
    isClient && dueDate !== null && debt.settled_at === null && dueDate < todayLocalISO();
  const Icon = dueDate ? CalendarClock : Clock;

  return (
    <p
      className={`mt-3 flex items-center gap-1.5 text-sm ${
        isOverdue ? "font-medium text-rose-600" : "text-stone-500"
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {dueDate ? "Jatuh tempo" : "Dicatat"}{" "}
      {isClient ? formatRelativeDate(dueDate ?? debt.created_at) : "…"}
    </p>
  );
}

const BUTTON_TONES = {
  primary: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  neutral: "bg-stone-100 text-stone-700 hover:bg-stone-200",
  danger: "text-rose-600 hover:bg-rose-50",
};

type ActionButtonProps = {
  icon: LucideIcon;
  label: string;
  tone: keyof typeof BUTTON_TONES;
  disabled: boolean;
  loading?: boolean;
  onClick: () => void;
};

function ActionButton({ icon: Icon, label, tone, disabled, loading, onClick }: ActionButtonProps) {
  const ShownIcon = loading ? Loader2 : Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={loading}
      className={`flex h-11 flex-1 basis-auto items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium whitespace-nowrap transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 sm:flex-none ${BUTTON_TONES[tone]}`}
    >
      <ShownIcon className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
      {label}
    </button>
  );
}
