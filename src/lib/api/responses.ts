import type { User } from "@supabase/supabase-js";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function serverError(context: string, error: unknown): Response {
  console.error(`[${context}]`, error);
  return jsonError("Ada masalah di server, coba lagi ya", 500);
}

export async function getAuthedClient(): Promise<
  { supabase: ServerClient; user: User } | Response
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Kamu harus login dulu", 401);
  return { supabase, user };
}

export function parseWith<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> | Response {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);
  return parsed.data;
}

export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T> | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Format JSON-nya nggak valid", 400);
  }
  return parseWith(schema, body);
}
