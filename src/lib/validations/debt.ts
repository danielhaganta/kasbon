import { z } from "zod";

export const MAX_AMOUNT = 1_000_000_000_000;

export const debtTypeSchema = z.enum(["owed_to_me", "i_owe"], "Tipe catatannya nggak valid");

export const debtInputSchema = z.object({
  type: debtTypeSchema,
  counterpart_name: z
    .string("Nama wajib diisi ya")
    .trim()
    .min(1, "Nama wajib diisi ya")
    .max(100, "Namanya kepanjangan, maksimal 100 karakter ya"),
  amount: z
    .number("Jumlahnya harus angka ya")
    .int("Jumlahnya harus angka bulat ya")
    .positive("Jumlahnya harus lebih dari 0 ya")
    .max(MAX_AMOUNT, "Jumlahnya kegedean, maksimal 1 triliun ya"),
  due_date: z.iso.date("Format tanggalnya harus YYYY-MM-DD ya").nullish(),
  note: z
    .string("Catatannya harus teks ya")
    .trim()
    .max(200, "Catatannya kepanjangan, maksimal 200 karakter ya")
    .transform((note) => note || null)
    .nullish(),
});

export const debtUpdateSchema = debtInputSchema
  .partial()
  .extend({ settled: z.boolean("Status lunas harus true/false ya").optional() })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    error: "Nggak ada yang diubah nih",
  });

export const debtQuerySchema = z.object({
  status: z
    .enum(["all", "unsettled", "settled"], "Filter status nggak valid")
    .default("all"),
  type: z.enum(["all", "owed_to_me", "i_owe"], "Filter tipe nggak valid").default("all"),
});

export type DebtType = z.infer<typeof debtTypeSchema>;
export type DebtInput = z.infer<typeof debtInputSchema>;
export type DebtUpdate = z.infer<typeof debtUpdateSchema>;
export type DebtQuery = z.infer<typeof debtQuerySchema>;
