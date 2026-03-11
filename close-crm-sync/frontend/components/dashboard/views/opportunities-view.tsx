"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import DataTable from "@/components/dashboard/data-table";
import BadgeStatus from "@/components/dashboard/badge-status";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { euro, pct } from "@/lib/formatters";
import { isActiveStage } from "@/lib/status-mapping";
import { fetchDashboardOpportunities, fetchPipelineStages, fetchAvgSalesCycle, fetchCloserPipeline } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import type { Filters } from "@/lib/constants";
import CustomTooltip from "./shared-tooltip";

const PAGE_SIZE = 20;

export default function OpportunitiesView({ filters }: { filters: Filters }) {
  const [sortKey, setSortKey] = useState("value");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: opps, loading: loadingOpps, error: errorOpps } = useDashboardQuery(fetchDashboardOpportunities, filters);
  const { data: stages, loading: loadingStages, error: errorStages } = useDashboardQuery(fetchPipelineStages, filters);
  const { data: avgCycle, loading: loadingCycle } = useDashboardQuery(fetchAvgSalesCycle, filters);
  const { data: closerPipeline, loading: loadingPipeline } = useDashboardQuery(fetchCloserPipeline, filters);

  const filtered = useMemo(
    () => (opps ?? []).filter((o) => filters.rep === "Alle" || o.rep === filters.rep),
    [opps, filters.rep]
  );

  if (errorOpps || errorStages) return <ErrorCard message={errorOpps ?? errorStages ?? "Fehler"} />;

  const loading = loadingOpps || loadingStages || loadingCycle || loadingPipeline;
  const pipelineStages = stages ?? [];

  // KPIs from ALL opportunities (via pipelineStages)
  const wonStage = pipelineStages.find((s) => s.stage === "Won");
  const lostStage = pipelineStages.find((s) => s.stage === "Lost");
  const wonCount = wonStage?.count ?? 0;
  const lostCount = lostStage?.count ?? 0;
  const totalOpps = pipelineStages.reduce((s, st) => s + st.count, 0);
  const winRate = totalOpps > 0 ? (wonCount / totalOpps) * 100 : 0;
  const activeStages = pipelineStages.filter((s) => isActiveStage(s.stage as any));
  const totalPipeline = activeStages.reduce((s, p) => s + p.value, 0);
  const activeCount = activeStages.reduce((s, p) => s + p.count, 0);

  // Table: critical opps only (from fetchDashboardOpportunities)
  const sorted = [...filtered].sort((a: any, b: any) => b[sortKey] - a[sortKey]);
  const paged = sorted.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        <KpiCard label="Pipeline Value" value={euro(totalPipeline)} accent />
        <KpiCard label="Offen" value={activeCount} />
        <KpiCard label="Won" value={wonCount} />
        <KpiCard label="Lost" value={lostCount} />
        <KpiCard label="Win Rate" value={pct(winRate)} />
        <KpiCard label="Ø Sales Cycle" value={`${avgCycle ?? 0} Tage`} />
      </div>

      {/* Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Pipeline Funnel">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipelineStages} layout="vertical">
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]} name="Pipeline €">
                {pipelineStages.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-3">
            {pipelineStages.map((d) => (
              <div key={d.stage} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.stage}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-muted-foreground">{d.count} Deals</span>
                  <span className="font-semibold tabnum">{euro(d.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Health Indikatoren">
          <div className="flex flex-col gap-4 mt-2">
            {[
              { label: "Inaktiv > 14 Tage", val: String(filtered.filter((o) => o.lastActivityDays > 14).length), variant: "danger" as const },
              { label: "Alter > 60 Tage", val: String(filtered.filter((o) => o.stageAge > 60).length), variant: "danger" as const },
              { label: "Hohes Risiko", val: String(filtered.filter((o) => o.risk === "high").length), variant: "warning" as const },
            ].map((h) => (
              <div
                key={h.label}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  h.variant === "warning" ? "bg-warning/10" : "bg-destructive/10"
                }`}
              >
                <p className={`text-sm font-medium ${h.variant === "warning" ? "text-warning" : "text-destructive"}`}>
                  {h.label}
                </p>
                <p className={`text-xl font-bold tabnum ${h.variant === "warning" ? "text-warning" : "text-destructive"}`}>
                  {h.val}
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Pipeline pro Closer */}
      {(closerPipeline ?? []).length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4">Pipeline pro Closer</p>
          <DataTable
            columns={[
              { key: "name", label: "Closer", bold: true },
              { key: "egStattgefunden", label: "EG stattgef.", right: true, mono: true },
              { key: "sgStattgefunden", label: "SG stattgef.", right: true, mono: true },
              { key: "angebotVerschickt", label: "Angebot versch.", right: true, mono: true },
              { key: "won", label: "Won", right: true, mono: true, render: (v: number) => v > 0 ? <span className="text-success font-semibold">{v}</span> : "0" },
              { key: "lost", label: "Lost", right: true, mono: true, render: (v: number) => v > 0 ? <span className="text-destructive">{v}</span> : "0" },
              { key: "pipelineValue", label: "Pipeline-Wert", right: true, mono: true, render: (v: number) => euro(v) },
            ]}
            rows={[
              ...(closerPipeline ?? []),
              {
                userId: "_total",
                name: "Gesamt",
                egStattgefunden: (closerPipeline ?? []).reduce((s, r) => s + r.egStattgefunden, 0),
                sgStattgefunden: (closerPipeline ?? []).reduce((s, r) => s + r.sgStattgefunden, 0),
                angebotVerschickt: (closerPipeline ?? []).reduce((s, r) => s + r.angebotVerschickt, 0),
                won: (closerPipeline ?? []).reduce((s, r) => s + r.won, 0),
                lost: (closerPipeline ?? []).reduce((s, r) => s + r.lost, 0),
                pipelineValue: (closerPipeline ?? []).reduce((s, r) => s + r.pipelineValue, 0),
              },
            ]}
          />
        </Card>
      )}

      {/* Critical Opps Table */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Kritische Opportunities</p>
        <DataTable
          sortKey={sortKey}
          onSort={setSortKey}
          columns={[
            { key: "name", label: "Opportunity", bold: true, render: (v: string, row: any) => row.closeLeadId ? (
              <a href={`https://app.close.com/lead/${row.closeLeadId}/`} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline transition-colors">{v}</a>
            ) : v },
            { key: "rep", label: "Closer" },
            { key: "stage", label: "Stage", render: (v: string) => <BadgeStatus label={v} type={v === "Won" ? "success" : v.includes("SG") ? "warning" : "default"} /> },
            { key: "value", label: "Wert", right: true, mono: true, render: (v: number) => euro(v) },
            { key: "prob", label: "Prob.", right: true, render: (v: number) => pct(v) },
            { key: "lastActivityDays", label: "Letzte Akt.", right: true, render: (v: number) => `${v}d` },
            { key: "risk", label: "Risiko", render: (v: string) => <BadgeStatus label={v === "high" ? "Hoch" : v === "medium" ? "Mittel" : "OK"} type={v === "high" ? "danger" : v === "medium" ? "warning" : "success"} /> },
          ]}
          rows={paged}
        />
        {sorted.length > visibleCount && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Mehr laden
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
