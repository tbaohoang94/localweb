"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import DataTable from "@/components/dashboard/data-table";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { pct, minsToHHMM } from "@/lib/formatters";
import { fetchColdcallerKPIs, fetchMeetingTrend } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import type { Filters } from "@/lib/constants";
import CustomTooltip from "./shared-tooltip";

export default function ColdcallerView({ filters }: { filters: Filters }) {
  const [sortKey, setSortKey] = useState("terminGelegt");

  const { data: callers, loading, error } = useDashboardQuery(fetchColdcallerKPIs, filters);
  const { data: trendData, loading: loadingTrend } = useDashboardQuery(fetchMeetingTrend, filters);

  if (error) return <ErrorCard message={error} />;
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  const callerData = callers ?? [];
  const sorted = [...callerData].sort((a: any, b: any) => b[sortKey] - a[sortKey]);

  const totals = callerData.reduce(
    (acc, c) => ({
      talkTime: acc.talkTime + c.talkTime,
      bruttoCalls: acc.bruttoCalls + c.bruttoCalls,
      nettoCalls: acc.nettoCalls + c.nettoCalls,
      terminGelegt: acc.terminGelegt + c.terminGelegt,
      noShow: acc.noShow + c.noShow,
      egStattgefunden: acc.egStattgefunden + c.egStattgefunden,
    }),
    { talkTime: 0, bruttoCalls: 0, nettoCalls: 0, terminGelegt: 0, noShow: 0, egStattgefunden: 0 }
  );

  const totalTerminQuote = totals.nettoCalls > 0
    ? (totals.terminGelegt / totals.nettoCalls) * 100
    : 0;
  const totalShowUpRate = totals.terminGelegt > 0
    ? (totals.egStattgefunden / totals.terminGelegt) * 100
    : 0;
  const totalErreichbarkeit = totals.bruttoCalls > 0
    ? (totals.nettoCalls / totals.bruttoCalls) * 100
    : 0;

  const chartData = trendData ?? [];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold mb-4">Activity KPIs</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          <KpiCard label="Gesprächszeit" value={minsToHHMM(totals.talkTime)} accent />
          <KpiCard label="Bruttocalls" value={totals.bruttoCalls} />
          <KpiCard label="Nettocalls" value={totals.nettoCalls} />
          <KpiCard label="Erreichbarkeit" value={pct(totalErreichbarkeit)} />
          <KpiCard label="Meetings" value={totals.terminGelegt} />
          <KpiCard label="Terminquote" value={pct(totalTerminQuote)} />
          <KpiCard label="No Show" value={totals.noShow} />
          <KpiCard label="Show up Rate" value={pct(totalShowUpRate)} />
        </div>
      </div>

      {/* Meeting Trend Chart */}
      {!loadingTrend && chartData.length > 0 && (
        <ChartCard title="Meeting-Verlauf">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Meetings" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Coldcaller Vergleich</p>
        {sorted.length ? (
          <DataTable
            sortKey={sortKey}
            onSort={setSortKey}
            columns={[
              { key: "name", label: "Name", bold: true },
              { key: "talkTime", label: "Gesprächszeit", right: true, mono: true, render: (v: number) => minsToHHMM(v) },
              { key: "bruttoCalls", label: "Bruttocalls", right: true, mono: true },
              { key: "nettoCalls", label: "Nettocalls", right: true, mono: true },
              { key: "erreichbarkeitsQuote", label: "Erreichbarkeit", right: true, render: (v: number) => pct(v) },
              { key: "terminGelegtET", label: "Meetings ET", right: true, mono: true, bold: true },
              { key: "terminGelegtFT", label: "Meetings FT", right: true, mono: true, bold: true },
              { key: "terminQuote", label: "Terminquote", right: true, render: (v: number) => pct(v) },
              { key: "noShow", label: "EG no show", right: true, mono: true },
              { key: "egStattgefunden", label: "EG show", right: true, mono: true },
              { key: "showUpRate", label: "Show up Rate", right: true, render: (v: number) => pct(v) },
              { key: "neukunden", label: "Neukunden", right: true, mono: true },
            ]}
            rows={sorted}
          />
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">Keine Daten für diesen Filter.</p>
        )}
      </Card>
    </div>
  );
}
