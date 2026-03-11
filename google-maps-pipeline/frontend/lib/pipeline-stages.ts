/**
 * Zentrale Definition aller Pipeline-Stages.
 * Single Source of Truth fuer Labels, Farben und Reihenfolge.
 */

// --- Location Pipeline ---

export type LocationStage = "new" | "scraping" | "scraped" | "imported" | "failed_scrape";

export const LOCATION_STAGES: {
  key: LocationStage;
  label: string;
  color: string;
  badgeClass: string;
}[] = [
  { key: "new", label: "Neu", color: "blue", badgeClass: "bg-blue-100 text-blue-800" },
  {
    key: "scraping",
    label: "Scraping",
    color: "yellow",
    badgeClass: "bg-yellow-100 text-yellow-800",
  },
  {
    key: "scraped",
    label: "Gescraped",
    color: "indigo",
    badgeClass: "bg-indigo-100 text-indigo-800",
  },
  {
    key: "imported",
    label: "Importiert",
    color: "green",
    badgeClass: "bg-green-100 text-green-800",
  },
  { key: "failed_scrape", label: "Fehler", color: "red", badgeClass: "bg-red-100 text-red-800" },
];

export const LOCATION_FLOW_STAGES = LOCATION_STAGES.filter((s) => s.key !== "failed_scrape");
export const LOCATION_ERROR_STAGES = LOCATION_STAGES.filter((s) => s.key === "failed_scrape");

// --- Business Pipeline ---

export type BusinessStage =
  | "new"
  | "qualified"
  | "unqualified"
  | "enriching"
  | "enriched"
  | "failed_enrich"
  | "exported";

export const BUSINESS_STAGES: {
  key: BusinessStage;
  label: string;
  color: string;
  badgeClass: string;
}[] = [
  { key: "new", label: "Neu", color: "blue", badgeClass: "bg-blue-100 text-blue-800" },
  {
    key: "qualified",
    label: "Qualifiziert",
    color: "emerald",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    key: "unqualified",
    label: "Unqualifiziert",
    color: "gray",
    badgeClass: "bg-gray-100 text-gray-600",
  },
  {
    key: "enriching",
    label: "Enriching",
    color: "yellow",
    badgeClass: "bg-yellow-100 text-yellow-800",
  },
  { key: "enriched", label: "Enriched", color: "green", badgeClass: "bg-green-100 text-green-800" },
  { key: "failed_enrich", label: "Fehler", color: "red", badgeClass: "bg-red-100 text-red-800" },
  {
    key: "exported",
    label: "Exportiert",
    color: "purple",
    badgeClass: "bg-purple-100 text-purple-800",
  },
];

export const BUSINESS_FLOW_STAGES = BUSINESS_STAGES.filter(
  (s) => !["unqualified", "failed_enrich"].includes(s.key),
);

export const BUSINESS_EXIT_STAGES: { afterKey: string; stage: (typeof BUSINESS_STAGES)[number] }[] =
  [
    { afterKey: "new", stage: BUSINESS_STAGES.find((s) => s.key === "unqualified")! },
    { afterKey: "enriching", stage: BUSINESS_STAGES.find((s) => s.key === "failed_enrich")! },
  ];

// --- Farb-Map fuer Pipeline-Overview Visualisierung ---

export const STAGE_COLOR_MAP: Record<
  string,
  { bg: string; text: string; ring: string; bar: string }
> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200", bar: "bg-blue-500" },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    ring: "ring-yellow-200",
    bar: "bg-yellow-500",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
    bar: "bg-indigo-500",
  },
  green: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200", bar: "bg-green-500" },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    bar: "bg-emerald-500",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-200",
    bar: "bg-purple-500",
  },
  red: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", bar: "bg-red-500" },
  gray: { bg: "bg-gray-50", text: "text-gray-500", ring: "ring-gray-200", bar: "bg-gray-400" },
};

// --- Lookup Helpers ---

export function getLocationStage(key: string) {
  return LOCATION_STAGES.find((s) => s.key === key);
}

export function getBusinessStage(key: string) {
  return BUSINESS_STAGES.find((s) => s.key === key);
}

export function getStageBadgeClass(stage: string): string {
  const loc = getLocationStage(stage);
  if (loc) return loc.badgeClass;
  const biz = getBusinessStage(stage);
  if (biz) return biz.badgeClass;
  return "bg-gray-100 text-gray-800";
}

export function getStageLabel(stage: string): string {
  const loc = getLocationStage(stage);
  if (loc) return loc.label;
  const biz = getBusinessStage(stage);
  if (biz) return biz.label;
  return stage;
}
