"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  LOCATION_FLOW_STAGES,
  LOCATION_ERROR_STAGES,
  BUSINESS_FLOW_STAGES,
  BUSINESS_EXIT_STAGES,
  STAGE_COLOR_MAP,
} from "@/lib/pipeline-stages";
import { formatNumber } from "@/lib/format";
import { usePipelineCounts } from "@/lib/hooks/use-pipeline-counts";

export default function PipelineOverview() {
  const { locations, businesses, loading } = usePipelineCounts();

  if (loading) {
    return (
      <Card className="p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Pipeline Uebersicht</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
        </div>
      </Card>
    );
  }

  const locTotal = Object.values(locations).reduce((a, b) => a + b, 0);
  const bizTotal = Object.values(businesses).reduce((a, b) => a + b, 0);

  const bizDone =
    (businesses.unqualified ?? 0) + (businesses.failed_enrich ?? 0) + (businesses.exported ?? 0);
  const bizProgress = bizTotal > 0 ? Math.round((bizDone / bizTotal) * 100) : 0;

  return (
    <Card className="p-6 mb-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Pipeline Uebersicht</h2>
        <span className="text-xs text-muted-foreground tabnum">
          Gesamt-Fortschritt: {bizProgress}%
        </span>
      </div>

      {/* Locations Pipeline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-medium text-muted-foreground">Locations</h3>
          <span className="text-xs text-muted-foreground/60 tabnum">
            ({formatNumber(locTotal)} gesamt)
          </span>
        </div>
        <div className="flex items-start gap-1 flex-wrap">
          {LOCATION_FLOW_STAGES.map((stage, i) => (
            <div key={stage.key} className="flex items-start">
              <StageBox stage={stage} count={locations[stage.key] ?? 0} total={locTotal} />
              {i < LOCATION_FLOW_STAGES.length - 1 && <Arrow />}
            </div>
          ))}
          {LOCATION_ERROR_STAGES.map((stage) => (
            <div key={stage.key} className="flex items-start ml-4">
              <div className="flex flex-col items-center mr-1">
                <span className="text-muted-foreground/40 text-xs mb-1">Fehler</span>
                <span className="text-muted-foreground/40">&#8628;</span>
              </div>
              <StageBox stage={stage} count={locations[stage.key] ?? 0} total={locTotal} />
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Businesses Pipeline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-medium text-muted-foreground">Businesses</h3>
          <span className="text-xs text-muted-foreground/60 tabnum">
            ({formatNumber(bizTotal)} gesamt)
          </span>
        </div>

        <div className="flex items-start gap-1 flex-wrap">
          {BUSINESS_FLOW_STAGES.map((stage, i) => (
            <div key={stage.key} className="flex items-start">
              <div className="flex flex-col items-center">
                <StageBox stage={stage} count={businesses[stage.key] ?? 0} total={bizTotal} />
                {BUSINESS_EXIT_STAGES.filter((e) => e.afterKey === stage.key).map((exit) => (
                  <div key={exit.stage.key} className="flex flex-col items-center mt-1">
                    <span className="text-muted-foreground/40 text-xs">&#8595;</span>
                    <StageBox
                      stage={exit.stage}
                      count={businesses[exit.stage.key] ?? 0}
                      total={bizTotal}
                      small
                    />
                  </div>
                ))}
              </div>
              {i < BUSINESS_FLOW_STAGES.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// --- Subkomponenten ---

interface StageBoxProps {
  stage: { key: string; label: string; color: string };
  count: number;
  total: number;
  small?: boolean;
}

function StageBox({ stage, count, total, small = false }: StageBoxProps) {
  const defaultColors = {
    bg: "bg-gray-50",
    text: "text-gray-500",
    ring: "ring-gray-200",
    bar: "bg-gray-400",
  };
  const colors = STAGE_COLOR_MAP[stage.color] ?? defaultColors;
  const pct = total > 0 ? (count / total) * 100 : 0;
  const isActive = count > 0;

  return (
    <div
      className={cn(
        "rounded-lg ring-1 transition-all duration-200",
        colors.ring,
        colors.bg,
        small ? "px-3 py-2 min-w-[100px]" : "px-4 py-3 min-w-[120px]",
        isActive ? "shadow-sm" : "opacity-50",
      )}
    >
      <div className={cn("text-xs font-medium", colors.text, !small && "mb-1")}>{stage.label}</div>
      <div className={cn("font-bold tabnum", colors.text, small ? "text-lg" : "text-2xl")}>
        {formatNumber(count)}
      </div>
      {!small && total > 0 && (
        <div className="mt-1.5">
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", colors.bar)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground/60 mt-0.5 tabnum">
            {pct.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center self-center px-1 text-muted-foreground/30">
      <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="mt-4">
        <path d="M0 6H16M16 6L11 1M16 6L11 11" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
