import type { DebtType } from "@/lib/validations/debt";

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  owed_to_me: "Dihutang",
  i_owe: "Saya hutang",
};
