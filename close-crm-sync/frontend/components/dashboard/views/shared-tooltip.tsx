"use client";

import { euro } from "@/lib/formatters";

export default function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-foreground text-background px-3 py-2.5 rounded-lg text-xs shadow-lg">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          <span className="opacity-70">{p.name}:</span>
          <span className="font-semibold tabnum">
            {typeof p.value === "number" && p.value > 1000
              ? euro(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
