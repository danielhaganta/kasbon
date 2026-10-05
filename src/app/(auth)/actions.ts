"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState =
  | { error?: string; message?: string; email: string }
  | undefined;

const credentialsSchema = z.object({
  email: z.email("Format email-nya belum bener nih"),
  password: z.string().min(6, "Password minimal 6 karakter ya"),
});

const EMAIL_TAKEN = "Email ini udah terdaftar, coba masuk aja";
const RATE_LIMITED = "Kebanyakan percobaan nih, tunggu bentar ya";
const GENERIC_ERROR = "Ada masalah di server, coba lagi ya";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email atau password salah nih",
  email_not_confirmed: "Email kamu belum dikonfirmasi, cek inbox dulu ya",
  user_already_exists: EMAIL_TAKEN,
  email_exists: EMAIL_TAKEN,
  weak_password: "Password-nya kurang kuat, coba yang lebih susah ditebak",
  over_request_rate_limit: RATE_LIMITED,
  over_email_send_rate_limit: RATE_LIMITED,
};

function toMessage(error: { code?: string; message: string }) {
  const message = error.code && ERROR_MESSAGES[error.code];
  if (message) return message;
  console.error("Supabase auth error:", error.code, error.message);
  return GENERIC_ERROR;
}

function parseCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const parsed = parseCredentials(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: toMessage(error), email };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const parsed = parseCredentials(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) return { error: toMessage(error), email };

  // With email confirmation on, Supabase hides duplicates: no error, empty identities.
  if (data.user?.identities?.length === 0) return { error: EMAIL_TAKEN, email };

  if (!data.session) {
    return {
      message: "Akun udah dibuat! Cek email kamu buat konfirmasi, abis itu masuk ya",
      email,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
