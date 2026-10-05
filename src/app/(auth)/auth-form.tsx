"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "./actions";

const MODES = {
  login: {
    action: login,
    heading: "Masuk dulu",
    submit: "Masuk",
    pending: "Lagi masuk...",
    passwordAutoComplete: "current-password",
    switchText: "Belum punya akun?",
    switchHref: "/signup",
    switchLabel: "Daftar",
  },
  signup: {
    action: signup,
    heading: "Bikin akun",
    submit: "Daftar",
    pending: "Lagi daftar...",
    passwordAutoComplete: "new-password",
    switchText: "Udah punya akun?",
    switchHref: "/login",
    switchLabel: "Masuk",
  },
} as const;

const inputClass =
  "h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15";

export function AuthForm({ mode }: { mode: keyof typeof MODES }) {
  const config = MODES[mode];
  const [state, formAction, isPending] = useActionState(config.action, undefined);

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_1px_0_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(28_25_23/0.18)]">
      <h2 className="text-xl font-semibold text-stone-900">{config.heading}</h2>

      <form action={formAction} className="mt-5 flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="kamu@email.com"
            defaultValue={state?.email}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-stone-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={config.passwordAutoComplete}
            placeholder="Minimal 6 karakter"
            minLength={6}
            required
            className={inputClass}
          />
        </div>

        <div aria-live="polite">
          {state?.error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state?.message && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {state.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {isPending ? config.pending : config.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        {config.switchText}{" "}
        <Link
          href={config.switchHref}
          className="font-semibold text-emerald-700 underline-offset-4 hover:underline"
        >
          {config.switchLabel}
        </Link>
      </p>
    </div>
  );
}
