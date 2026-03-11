/**
 * Zentrale Formatierungs-Utilities.
 */

/** Datum formatieren (de-DE) mit Uhrzeit */
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Datum formatieren (de-DE) ohne Uhrzeit */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("de-DE");
}

/** Zahl mit de-DE Tausenderpunkten formatieren */
export function formatNumber(value: number): string {
  return value.toLocaleString("de-DE");
}

/** Relative Zeitangabe (z.B. "vor 5 Minuten") */
export function formatDistanceToNow(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min`;
  if (diffH < 24) return `vor ${diffH} Std`;
  if (diffD < 7) return `vor ${diffD} Tagen`;
  return formatDateTime(dateStr);
}
