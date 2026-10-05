import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  getAuthedClient,
  jsonError,
  parseJsonBody,
  parseWith,
  serverError,
} from "@/lib/api/responses";
import { debtUpdateSchema } from "@/lib/validations/debt";

type Context = RouteContext<"/api/debts/[id]">;

const idSchema = z.uuid("ID-nya nggak valid");
const NOT_FOUND = "Catatannya nggak ketemu";

export async function PATCH(request: NextRequest, ctx: Context) {
  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const id = parseWith(idSchema, (await ctx.params).id);
  if (id instanceof Response) return id;

  const body = await parseJsonBody(request, debtUpdateSchema);
  if (body instanceof Response) return body;

  const { settled, ...fields } = body;
  const changes = settled === false ? { ...fields, settled_at: null } : fields;

  if (Object.keys(changes).length > 0) {
    const { error } = await supabase.from("debts").update(changes).eq("id", id);
    if (error) return serverError("PATCH /api/debts/[id]", error);
  }

  if (settled === true) {
    // Only when still unsettled, so repeated calls keep the first settled_at.
    const { error } = await supabase
      .from("debts")
      .update({ settled_at: new Date().toISOString() })
      .eq("id", id)
      .is("settled_at", null);
    if (error) return serverError("PATCH /api/debts/[id] settle", error);
  }

  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return serverError("PATCH /api/debts/[id] reselect", error);
  if (!data) return jsonError(NOT_FOUND, 404);

  return Response.json({ data });
}

export async function DELETE(_request: NextRequest, ctx: Context) {
  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;

  const id = parseWith(idSchema, (await ctx.params).id);
  if (id instanceof Response) return id;

  const { data, error } = await auth.supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return serverError("DELETE /api/debts/[id]", error);
  if (data.length === 0) return jsonError(NOT_FOUND, 404);

  return Response.json({ success: true });
}
