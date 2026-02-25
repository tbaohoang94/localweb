/* ─── FILTERS ─── */
export interface Filters {
  from: string;
  to: string;
  rep: string;
}

export type DatePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "all_time"
  | "custom";

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Heute",
  yesterday: "Gestern",
  this_week: "Diese Woche",
  last_week: "Letzte Woche",
  this_month: "Dieser Monat",
  last_month: "Letzter Monat",
  all_time: "Gesamt",
  custom: "Benutzerdefiniert",
};

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function presetToRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const today = fmt(now);

  if (preset === "today") {
    return { from: today, to: today };
  }
  if (preset === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const s = fmt(y);
    return { from: s, to: s };
  }
  if (preset === "this_week") {
    const day = now.getDay() || 7; // Mon=1 … Sun=7
    const mon = new Date(now);
    mon.setDate(now.getDate() - day + 1);
    return { from: fmt(mon), to: today };
  }
  if (preset === "last_week") {
    const day = now.getDay() || 7;
    const lastMon = new Date(now);
    lastMon.setDate(now.getDate() - day - 6);
    const lastSun = new Date(lastMon);
    lastSun.setDate(lastMon.getDate() + 6);
    return { from: fmt(lastMon), to: fmt(lastSun) };
  }
  if (preset === "this_month") {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return { from: `${y}-${m}-01`, to: today };
  }
  if (preset === "last_month") {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: fmt(d), to: fmt(last) };
  }
  if (preset === "all_time") {
    return { from: "2020-01-01", to: today };
  }
  // custom: caller manages from/to separately
  return { from: "", to: "" };
}

export function getDefaultFilters(): Filters {
  const range = presetToRange("this_month");
  return { from: range.from, to: range.to, rep: "Alle" };
}

export const DEFAULT_FILTERS: Filters = getDefaultFilters();

/* ─── PAGE TITLES ─── */
export const PAGE_TITLES: Record<string, string> = {
  controlling: "Controlling Dashboard",
  opportunities: "Opportunity Dashboard",
  coldcaller: "Coldcaller Dashboard",
  closer: "Closer Dashboard",
  "provisionen-closer": "Provisionen — Closer",
  "provisionen-caller": "Provisionen — Coldcaller",
  "1on1": "1:1 Coaching Dashboard",
};
