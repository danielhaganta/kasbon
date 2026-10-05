"use client";

export type DebtView = "entry" | "person";

const OPTIONS: { value: DebtView; label: string }[] = [
  { value: "entry", label: "Per entry" },
  { value: "person", label: "Per orang" },
];

type ViewToggleProps = {
  value: DebtView;
  onChange: (view: DebtView) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div role="group" aria-label="Tampilan" className="grid grid-cols-2 gap-1 rounded-xl bg-stone-200/70 p-1">
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`h-11 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition active:scale-[0.97] sm:h-9 ${
              isActive ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
