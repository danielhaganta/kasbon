"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import type { Debt } from "@/hooks/useDebts";
import { formatRupiah, todayLocalISO } from "@/lib/format";
import { debtInputSchema, type DebtInput, type DebtType } from "@/lib/validations/debt";

const NOTE_MAX = 200;
const FIELDS = ["type", "counterpart_name", "amount", "due_date", "note"] as const;

type FieldName = (typeof FIELDS)[number];
type FormValues = Record<Exclude<FieldName, "type">, string> & { type: DebtType };
type FieldErrors = Partial<Record<FieldName, string>>;

const TYPE_OPTIONS: { value: DebtType; label: string }[] = [
  { value: "owed_to_me", label: "Saya dihutang" },
  { value: "i_owe", label: "Saya hutang" },
];

const inputClass =
  "h-12 w-full rounded-xl border bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 outline-none transition focus:ring-4 aria-invalid:border-rose-400 aria-invalid:focus:ring-rose-500/15 border-stone-300 focus:border-emerald-600 focus:ring-emerald-600/15";

type DebtFormModalProps = {
  /** Existing debt = edit mode; undefined = create mode. */
  debt?: Debt;
  onSave: (input: DebtInput) => Promise<void>;
  onClose: () => void;
};

function initialValues(debt: Debt | undefined): FormValues {
  return {
    type: debt?.type ?? "owed_to_me",
    counterpart_name: debt?.counterpart_name ?? "",
    amount: debt ? String(debt.amount) : "",
    due_date: debt ? (debt.due_date ?? "") : todayLocalISO(),
    note: debt?.note ?? "",
  };
}

// Mounted only while open: the parent renders it conditionally, so state starts fresh each time.
export function DebtFormModal({ debt, onSave, onClose }: DebtFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const pointerDownOnBackdrop = useRef(false);
  const [values, setValues] = useState(() => initialValues(debt));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const id = useId();
  const isEdit = debt !== undefined;

  useEffect(() => {
    dialogRef.current?.showModal();
    firstFieldRef.current?.focus();
  }, []);

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function requestClose() {
    if (!isSubmitting) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const parsed = debtInputSchema.safeParse({
      type: values.type,
      counterpart_name: values.counterpart_name,
      amount: values.amount === "" ? undefined : Number(values.amount),
      due_date: values.due_date || null,
      note: values.note,
    });

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      const nextErrors: FieldErrors = {};
      for (const field of FIELDS) nextErrors[field] = fieldErrors[field]?.[0];
      setErrors(nextErrors);

      const firstInvalid = FIELDS.find((field) => nextErrors[field]);
      const element = firstInvalid && event.currentTarget.elements.namedItem(firstInvalid);
      if (element instanceof HTMLElement) element.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(parsed.data);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Ada masalah, coba lagi ya");
      setIsSubmitting(false);
    }
  }

  const fieldId = (field: FieldName) => `${id}-${field}`;
  const errorProps = (field: FieldName) =>
    errors[field]
      ? { "aria-invalid": true, "aria-describedby": `${fieldId(field)}-error` }
      : {};

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      // Browsers may force-close after repeated Esc; keep parent state in sync.
      onClose={onClose}
      onCancel={(event) => {
        // Esc: let React state drive closing (and block it mid-submit).
        event.preventDefault();
        requestClose();
      }}
      onPointerDown={(event) => {
        pointerDownOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        // Both press and release on the backdrop, so a text selection drag doesn't close it.
        if (pointerDownOnBackdrop.current && event.target === event.currentTarget) requestClose();
      }}
      className="mx-0 mb-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-3xl bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-900/40 backdrop:backdrop-blur-[2px] motion-safe:animate-sheet-in sm:m-auto sm:max-h-[85dvh] sm:max-w-md sm:rounded-3xl sm:motion-safe:animate-dialog-in"
    >
      <form onSubmit={handleSubmit} noValidate className="flex max-h-[inherit] flex-col">
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-stone-200 sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-5 pt-2 sm:px-6 sm:pt-5">
          <h2 id={`${id}-title`} className="text-xl font-semibold">
            {isEdit ? "Edit catatan" : "Catat baru"}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Tutup"
            className="grid size-10 place-items-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:scale-95"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-4 pt-4 sm:px-6">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-stone-700">Tipe</legend>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
              {TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="relative flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-stone-600 transition has-checked:bg-white has-checked:text-stone-900 has-checked:shadow-sm has-focus-visible:ring-2 has-focus-visible:ring-emerald-600/40 hover:text-stone-900"
                >
                  <input
                    ref={values.type === option.value ? firstFieldRef : undefined}
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={values.type === option.value}
                    onChange={() => update("type", option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <FieldError id={`${fieldId("type")}-error`} message={errors.type} />
          </fieldset>

          <Field label="Nama orang" htmlFor={fieldId("counterpart_name")}>
            <input
              id={fieldId("counterpart_name")}
              name="counterpart_name"
              type="text"
              autoComplete="off"
              maxLength={100}
              placeholder="Misal: Budi"
              value={values.counterpart_name}
              onChange={(event) => update("counterpart_name", event.target.value)}
              className={inputClass}
              {...errorProps("counterpart_name")}
            />
            <FieldError id={`${fieldId("counterpart_name")}-error`} message={errors.counterpart_name} />
          </Field>

          <Field label="Jumlah" htmlFor={fieldId("amount")}>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-medium text-stone-400">
                Rp
              </span>
              <input
                id={fieldId("amount")}
                name="amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={15}
                placeholder="50000"
                value={values.amount}
                // Digits only, so "50.000" or "50,000" typed by habit still becomes 50000.
                onChange={(event) => update("amount", event.target.value.replace(/\D/g, ""))}
                className={`${inputClass} pl-11 tabular-nums`}
                {...errorProps("amount")}
              />
            </div>
            {errors.amount ? (
              <FieldError id={`${fieldId("amount")}-error`} message={errors.amount} />
            ) : (
              <p className="mt-1.5 text-sm text-stone-500 tabular-nums">
                {values.amount ? formatRupiah(Number(values.amount)) : "Ketik angkanya aja, tanpa titik"}
              </p>
            )}
          </Field>

          <Field label="Tanggal" htmlFor={fieldId("due_date")} hint="opsional">
            <input
              id={fieldId("due_date")}
              name="due_date"
              type="date"
              value={values.due_date}
              onChange={(event) => update("due_date", event.target.value)}
              className={inputClass}
              {...errorProps("due_date")}
            />
            <FieldError id={`${fieldId("due_date")}-error`} message={errors.due_date} />
          </Field>

          <Field label="Catatan" htmlFor={fieldId("note")} hint="opsional">
            <textarea
              id={fieldId("note")}
              name="note"
              rows={3}
              maxLength={NOTE_MAX}
              placeholder="Misal: patungan makan siang"
              value={values.note}
              onChange={(event) => update("note", event.target.value)}
              className={`${inputClass} h-auto resize-none py-3`}
              {...errorProps("note")}
            />
            <div className="mt-1.5 flex justify-between gap-3">
              <FieldError id={`${fieldId("note")}-error`} message={errors.note} inline />
              <span
                className={`ml-auto text-xs tabular-nums ${values.note.length >= NOTE_MAX ? "text-rose-600" : "text-stone-400"}`}
              >
                {values.note.length}/{NOTE_MAX}
              </span>
            </div>
          </Field>

          {serverError && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-stone-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:justify-end sm:px-6 sm:pb-5">
          <button
            type="button"
            onClick={requestClose}
            disabled={isSubmitting}
            className="h-12 flex-1 rounded-xl px-5 font-medium text-stone-700 transition hover:bg-stone-100 active:scale-[0.98] disabled:opacity-60 sm:h-11 sm:flex-none"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:flex-none"
          >
            {isSubmitting && <Loader2 className="size-5 animate-spin" aria-hidden />}
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
        {hint && <span className="ml-1 font-normal text-stone-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function FieldError({ id, message, inline }: { id: string; message?: string; inline?: boolean }) {
  if (!message) return null;
  return (
    <p id={id} className={`text-sm text-rose-600 ${inline ? "" : "mt-1.5"}`}>
      {message}
    </p>
  );
}
