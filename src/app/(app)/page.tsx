import { redirect } from "next/navigation";
import { AppHeader } from "@/components/debts/AppHeader";
import { DebtDashboard } from "@/components/debts/DebtDashboard";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col bg-stone-100">
      <AppHeader email={user.email} />
      <DebtDashboard />
    </div>
  );
}
