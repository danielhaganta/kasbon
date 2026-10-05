import { LogOut } from "lucide-react";
import { logout } from "@/app/(app)/actions";

export function AppHeader({ email }: { email: string | undefined }) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
        <span className="text-lg font-bold tracking-tight text-stone-900">Kasbon</span>
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm text-stone-600">{email}</span>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Keluar"
              title="Keluar"
              className="grid size-11 shrink-0 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/30 active:scale-95"
            >
              <LogOut className="size-5" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
