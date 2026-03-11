export const euro = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export const pct = (n: number) => `${Number(n).toFixed(1)}%`;

export const num = (n: number) => new Intl.NumberFormat("de-DE").format(n);

/** Format a DB user name from first_name + last_name */
export function userName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName.charAt(0)}.`;
}

/** Days between two dates (date strings) */
export function daysBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** Days since a date until now */
export function daysSince(date: string): number {
  return daysBetween(date, new Date().toISOString());
}

/** Format date as DD.MM (immer deutsche Zeitzone) */
export function formatDateShort(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

/** Get ISO week string like "KW 8" */
export function isoWeekLabel(date: string): string {
  const d = new Date(date);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `KW ${weekNo}`;
}

/** Get month abbreviation like "Feb" */
export function monthLabel(date: string): string {
  return new Date(date).toLocaleString("de-DE", { month: "short", timeZone: "Europe/Berlin" });
}

/** Format minutes as hh:mm H (e.g. 1880 → "31:20 H") */
export function minsToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, "0")} H`;
}
