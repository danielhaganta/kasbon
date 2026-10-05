import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <header className="sticky top-0 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
          <span className="text-lg font-bold tracking-tight text-stone-900">
            Kasbon
          </span>
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-sm text-stone-600">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                aria-label="Keluar"
                title="Keluar"
                className="grid size-10 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/30 active:scale-95"
              >
                <LogOut className="size-5" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <p className="text-stone-600">Belum ada catatan.</p>
      </main>
    </>
  );
}
