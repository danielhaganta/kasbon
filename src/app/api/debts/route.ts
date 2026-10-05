import type { NextRequest } from "next/server";
import {
  getAuthedClient,
  parseJsonBody,
  parseWith,
  serverError,
} from "@/lib/api/responses";
import { debtInputSchema, debtQuerySchema } from "@/lib/validations/debt";

export async function GET(request: NextRequest) {
  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const filters = parseWith(
    debtQuerySchema,
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (filters instanceof Response) return filters;

  let listQuery = supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (filters.status === "unsettled") listQuery = listQuery.is("settled_at", null);
  if (filters.status === "settled") listQuery = listQuery.not("settled_at", "is", null);
  if (filters.type !== "all") listQuery = listQuery.eq("type", filters.type);

  // Summary ignores filters: summed in SQL over every unsettled debt the caller's RLS allows.
  const [list, summary] = await Promise.all([
    listQuery,
    supabase.rpc("get_debt_summary").single(),
  ]);
  if (list.error) return serverError("GET /api/debts list", list.error);
  if (summary.error) return serverError("GET /api/debts summary", summary.error);

  const { owed_to_me: owedToMe, i_owe: iOwe } = summary.data;

  return Response.json({
    data: list.data,
    summary: { owedToMe, iOwe, net: owedToMe - iOwe },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;

  const input = await parseJsonBody(request, debtInputSchema);
  if (input instanceof Response) return input;

  // user_id is never sent: zod strips unknown keys and the DB defaults it to auth.uid().
  const { data, error } = await auth.supabase
    .from("debts")
    .insert(input)
    .select()
    .single();
  if (error) return serverError("POST /api/debts", error);

  return Response.json({ data }, { status: 201 });
}
