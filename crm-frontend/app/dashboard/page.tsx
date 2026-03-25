"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Sidebar, { type ViewId } from "@/components/sidebar";
import FilterBar from "@/components/dashboard/filter-bar";
import { RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_FILTERS,
  PAGE_TITLES,
  presetToRange,
  type DatePreset,
  type Filters,
} from "@/lib/constants";
import { fetchActiveUsers } from "@/lib/dashboard-queries";
import { userName } from "@/lib/formatters";
import { createClient } from "@/lib/supabase-browser";
import type { DbUser } from "@/lib/types/dashboard";

const ControllingView = dynamic(
  () => import("@/components/dashboard/views/controlling-view"),
  { ssr: false }
);
const OpportunitiesView = dynamic(
  () => import("@/components/dashboard/views/opportunities-view"),
  { ssr: false }
);
const ColdcallerView = dynamic(
  () => import("@/components/dashboard/views/coldcaller-view"),
  { ssr: false }
);
const CloserView = dynamic(
  () => import("@/components/dashboard/views/closer-view"),
  { ssr: false }
);
const ProvisionenCloserView = dynamic(
  () => import("@/components/dashboard/views/provisionen-closer-view"),
  { ssr: false }
);
const ProvisionenCallerView = dynamic(
  () => import("@/components/dashboard/views/provisionen-caller-view"),
  { ssr: false }
);
const CoachingView = dynamic(
  () => import("@/components/dashboard/views/coaching-view"),
  { ssr: false }
);

export default function DashboardPage() {
  const [view, setView] = useState<ViewId>("controlling");
  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [syncing, setSyncing] = useState(false);
  const supabaseRef = useRef(createClient());

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL}/webhook/full-sync`, { method: "POST" });
    } catch {
      // ignore – webhook may not return JSON
    }
    // Webhook responds immediately (onReceived), sync runs in background ~2-3 min
    setTimeout(() => setSyncing(false), 120_000);
  }, []);

  useEffect(() => {
    fetchActiveUsers(supabaseRef.current).then(setUsers).catch(console.error);
  }, []);

  const repOptions = useMemo(() => {
    const closerIds = users.filter((u) => u.role === "closer").map((u) => u.id);
    const callerIds = users.filter((u) => u.role === "caller").map((u) => u.id);
    const allIds = users.map((u) => u.id);
    const nameMap: Record<string, string> = { Alle: "Alle" };
    users.forEach((u) => { nameMap[u.id] = userName(u.first_name, u.last_name); });
    return { all: ["Alle", ...allIds], closer: ["Alle", ...closerIds], caller: ["Alle", ...callerIds], nameMap };
  }, [users]);

  const filterConfig: Record<ViewId, { showRep: boolean; repOptions: string[] }> = {
    controlling: { showRep: false, repOptions: repOptions.all },
    opportunities: { showRep: true, repOptions: repOptions.closer },
    coldcaller: { showRep: true, repOptions: repOptions.caller },
    closer: { showRep: true, repOptions: repOptions.closer },
    "provisionen-closer": { showRep: true, repOptions: repOptions.closer },
    "provisionen-caller": { showRep: true, repOptions: repOptions.caller },
    "1on1": { showRep: true, repOptions: repOptions.all },
  };

  const handlePresetChange = (p: DatePreset) => {
    setPreset(p);
    if (p !== "custom") {
      const range = presetToRange(p);
      setFilters((f) => ({ ...f, from: range.from, to: range.to }));
    }
  };

  const cfg = filterConfig[view];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeView={view} onViewChange={(v) => { setView(v); setFilters((f) => ({ ...f, rep: "Alle" })); }} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <h1 className="text-sm font-semibold">{PAGE_TITLES[view]}</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={syncing}
              onClick={triggerSync}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sync läuft…" : "Sync"}
            </Button>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                A
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <FilterBar
            filters={filters}
            preset={preset}
            onChange={setFilters}
            onPresetChange={handlePresetChange}
            repOptions={cfg.repOptions}
            repNameMap={repOptions.nameMap}
            showRep={cfg.showRep}
          />

          <div className="animate-fade-in" key={view}>
            {view === "controlling" && <ControllingView filters={filters} />}
            {view === "opportunities" && <OpportunitiesView filters={filters} />}
            {view === "coldcaller" && <ColdcallerView filters={filters} />}
            {view === "closer" && <CloserView filters={filters} />}
            {view === "provisionen-closer" && <ProvisionenCloserView filters={filters} />}
            {view === "provisionen-caller" && <ProvisionenCallerView filters={filters} />}
            {view === "1on1" && <CoachingView filters={filters} />}
          </div>
        </div>
      </div>
    </div>
  );
}
