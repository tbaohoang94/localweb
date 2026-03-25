/**
 * Maps Close.io opportunity status_display_name to dashboard pipeline stages.
 *
 * Actual DB values (as of 2026-02):
 *   "Sales: EG - Stattgefunden"
 *   "Sales: SG - Anstehend"
 *   "Sales: SG - No Show"
 *   "Sales: SG - Stattgefunden"
 *   "Sales: Strategiegespräch stattgefunden Follow-up"
 *   "Sales: Angebot verschickt"
 *   "Sales: Won - Kunde"
 *   "Sales: Lost - Unqualifiziert"
 *   "Sales: Lost - später"
 *   "HR - Recruiting: Interview geführt"
 */

export type PipelineStageKey =
  | "EG stattgefunden"
  | "SG stattgefunden"
  | "Angebot verschickt"
  | "Won"
  | "Lost"
  | "Other";

export function mapStatus(status: string | null): PipelineStageKey {
  if (!status) return "Other";
  if (status.includes("Won")) return "Won";
  if (status.includes("Lost")) return "Lost";
  if (status.includes("Angebot")) return "Angebot verschickt";
  if (
    status.includes("Strategiegespräch") ||
    status.includes("SG - Stattgefunden") ||
    status.includes("SG - Anstehend") ||
    status.includes("SG - No Show")
  )
    return "SG stattgefunden";
  if (status.includes("EG")) return "EG stattgefunden";
  return "Other";
}

/** Whether an opportunity is considered "active" (in the pipeline, not terminal) */
export function isActiveStage(stage: PipelineStageKey): boolean {
  return stage !== "Won" && stage !== "Lost" && stage !== "Other";
}

/** Pipeline stage order for charts/funnels */
export const PIPELINE_ORDER: PipelineStageKey[] = [
  "EG stattgefunden",
  "SG stattgefunden",
  "Won",
];

/** Stage colors for charts */
export const STAGE_COLORS: Record<string, string> = {
  "EG stattgefunden": "hsl(217 91% 60%)",
  "SG stattgefunden": "hsl(217 91% 50%)",
  "Angebot verschickt": "hsl(217 91% 40%)",
  Won: "hsl(160 84% 39%)",
  Lost: "hsl(0 72% 51%)",
  Other: "hsl(220 9% 46%)",
};
