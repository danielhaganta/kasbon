"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  // On failure the session cookie stays, so redirecting would bounce back to "/".
  if (error) throw new Error("Gagal keluar, coba lagi ya");

  revalidatePath("/", "layout");
  redirect("/login");
}
