import { formatRupiah } from "@/lib/format";

type DebtBarChartProps = { owedToMe: number; iOwe: number };

export function DebtBarChart({ owedToMe, iOwe }: DebtBarChartProps) {
  const max = Math.max(owedToMe, iOwe);
  const bars = [
    { label: "Dihutang ke saya", amount: owedToMe, color: "bg-emerald-600" },
    { label: "Saya hutang", amount: iOwe, color: "bg-rose-500" },
  ];

  return (
    <figure className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <figcaption className="text-sm font-medium text-stone-700">Perbandingan</figcaption>
      <div className="mt-3 flex flex-col gap-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="text-stone-600">{bar.label}</span>
              <span className="font-semibold tabular-nums text-stone-900">
                {formatRupiah(bar.amount)}
              </span>
            </div>
            <div aria-hidden className="mt-1.5 h-3 overflow-hidden rounded-full bg-stone-100">
              {/* scaleX instead of width: animates on the compositor. Grows from 0 on mount, then transitions. */}
              <div
                className={`h-full origin-left rounded-full ${bar.color} transition-transform duration-700 ease-out motion-safe:animate-bar-grow`}
                style={{ transform: `scaleX(${max > 0 ? bar.amount / max : 0})` }}
              />
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
