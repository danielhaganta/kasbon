const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Intl separates "Rp" with a non-breaking space; spec wants a plain space.
export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount).replace(/ /g, " ");
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// "YYYY-MM-DD" is read as a local date; new Date("2026-10-06") would be UTC midnight.
function toLocalDay(value: string): Date {
  const match = DATE_ONLY.exec(value);
  if (match) return new Date(+match[1], +match[2] - 1, +match[3]);
  return startOfLocalDay(new Date(value));
}

export function formatRelativeDate(value: string, now = new Date()): string {
  // Math.round absorbs 23h/25h days around DST switches.
  const days = Math.round(
    (startOfLocalDay(now).getTime() - toLocalDay(value).getTime()) / MS_PER_DAY,
  );
  if (Number.isNaN(days)) return value;

  if (days === 0) return "hari ini";
  if (days === 1) return "kemarin";
  if (days === -1) return "besok";
  if (days < 0) return `${-days} hari lagi`;
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
}

export function todayLocalISO(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}
