"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  accent?: boolean;
}

export default function KpiCard({
  label,
  value,
  sub,
  trend,
  trendUp,
  accent,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group relative overflow-hidden",
        accent && "border-t-2 border-t-primary"
      )}
    >
      <div className="flex items-center gap-1.5 mb-3">
        {accent && (
          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        )}
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-semibold tracking-tight tabnum">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span
              className={cn(
                "text-[11px] font-semibold px-2 py-0.5 rounded",
                trendUp
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {trendUp ? "\u2191" : "\u2193"} {trend}
            </span>
          )}
          {sub && (
            <p className="text-xs text-muted-foreground">{sub}</p>
          )}
        </div>
      )}
    </Card>
  );
}
