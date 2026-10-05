import { ArrowDownLeft, ArrowUpRight, Info, type LucideIcon } from "lucide-react";
import type { DebtSummary } from "@/hooks/useDebts";
import { formatRupiah } from "@/lib/format";

const NET_TONES = {
  positive: { card: "bg-emerald-700 text-white", hint: "text-emerald-100", text: "Kamu lebih banyak dihutangin" },
  negative: { card: "bg-rose-600 text-white", hint: "text-rose-100", text: "Kamu lebih banyak berhutang" },
  zero: { card: "bg-stone-200 text-stone-800", hint: "text-stone-500", text: "Impas, aman" },
};

export function SummaryCards({ summary }: { summary: DebtSummary }) {
  const { owedToMe, iOwe, net } = summary;
  const tone = NET_TONES[net > 0 ? "positive" : net < 0 ? "negative" : "zero"];

  return (
    <section aria-label="Ringkasan">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div
          className={`col-span-2 rounded-3xl p-5 shadow-sm transition-colors duration-300 sm:col-span-1 ${tone.card}`}
        >
          <p className="text-sm font-medium opacity-90">Net</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums [overflow-wrap:anywhere] sm:text-2xl">
            {formatRupiah(net)}
          </p>
          <p className={`mt-1 text-sm ${tone.hint}`}>{tone.text}</p>
        </div>
        <StatCard label="Total dihutang ke saya" amount={owedToMe} icon={ArrowDownLeft} />
        <StatCard label="Total saya hutang" amount={iOwe} icon={ArrowUpRight} />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
        <Info className="size-3.5 shrink-0" aria-hidden />
        Yang dihitung cuma catatan yang belum lunas.
      </p>
    </section>
  );
}

type StatCardProps = { label: string; amount: number; icon: LucideIcon };

function StatCard({ label, amount, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <Icon className="size-5 text-stone-400" aria-hidden />
      <p className="mt-3 text-xs font-medium leading-snug text-stone-500 sm:text-sm">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums text-stone-900 [overflow-wrap:anywhere] sm:text-lg">
        {formatRupiah(amount)}
      </p>
    </div>
  );
}

export function SummaryCardsSkeleton() {
  return (
    <div aria-hidden className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="col-span-2 h-32 rounded-3xl bg-stone-200 sm:col-span-1" />
      <div className="h-32 rounded-3xl bg-stone-200/70" />
      <div className="h-32 rounded-3xl bg-stone-200/70" />
    </div>
  );
}
