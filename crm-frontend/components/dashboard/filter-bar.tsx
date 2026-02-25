"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DATE_PRESET_LABELS,
  presetToRange,
  getDefaultFilters,
  type DatePreset,
  type Filters,
} from "@/lib/constants";

interface FilterBarProps {
  filters: Filters;
  preset: DatePreset;
  onChange: (f: Filters) => void;
  onPresetChange: (p: DatePreset) => void;
  repOptions: string[];
  repNameMap?: Record<string, string>;
  showRep?: boolean;
}

export default function FilterBar({
  filters,
  preset,
  onChange,
  onPresetChange,
  repOptions,
  repNameMap,
  showRep = true,
}: FilterBarProps) {
  const handlePreset = (p: DatePreset) => {
    onPresetChange(p);
    if (p !== "custom") {
      const range = presetToRange(p);
      onChange({ ...filters, from: range.from, to: range.to });
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b px-6 py-3 flex items-center gap-3 flex-wrap">
      {/* Date preset dropdown */}
      <Select value={preset} onValueChange={(v) => handlePreset(v as DatePreset)}>
        <SelectTrigger className="h-8 w-[180px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((p) => (
            <SelectItem key={p} value={p}>
              {DATE_PRESET_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom date inputs */}
      {preset === "custom" && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">Von</label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => onChange({ ...filters, from: e.target.value })}
              className="h-8 w-[140px] text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">Bis</label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => onChange({ ...filters, to: e.target.value })}
              className="h-8 w-[140px] text-sm"
            />
          </div>
        </>
      )}

      {/* Rep filter */}
      {showRep && (
        <select
          value={filters.rep}
          onChange={(e) => onChange({ ...filters, rep: e.target.value })}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {repOptions.map((r) => (
            <option key={r} value={r}>
              {repNameMap?.[r] ?? r}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
