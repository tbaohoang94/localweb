"use client";

import { useState } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import DataTable from "@/components/dashboard/data-table";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { euro, pct } from "@/lib/formatters";
import { fetchCloserKPIs, fetchRevenueByMonth, fetchEgToSgRate } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import type { Filters } from "@/lib/constants";
import CustomTooltip from "./shared-tooltip";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
];

export default function CloserView({ filters }: { filters: Filters }) {
  const { data: closers, loading: l1, error: e1 } = useDashboardQuery(fetchCloserKPIs, filters);
  const { data: revenue, loading: l2, error: e2 } = useDashboardQuery(fetchRevenueByMonth, filters);
  const { data: egSgData, loading: l3, error: e3 } = useDashboardQuery(fetchEgToSgRate, filters);
  const [sortCloser, setSortCloser] = useState("umsatz");

  const anyError = e1 || e2 || e3;
  if (anyError) return <ErrorCard message={anyError ?? "Fehler"} />;

  const loading = l1 || l2 || l3;
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  const closerData = closers ?? [];
  const sortedClosers = [...closerData].sort((a: any, b: any) => b[sortCloser] - a[sortCloser]);

  const totalUmsatz = closerData.reduce((s, c) => s + c.umsatz, 0);
  const totalWon = closerData.reduce((s, c) => s + c.won, 0);
  const totalAllOpps = closerData.reduce((s, c) => s + c.won + c.lost + c.offeneOpps, 0);
  const totalWinRate = totalAllOpps > 0 ? (totalWon / totalAllOpps) * 100 : 0;
  const avgDeal = totalWon > 0 ? totalUmsatz / totalWon : 0;
  const withCycle = closerData.filter((c) => c.cycle > 0);
  const avgCycle = withCycle.length > 0
    ? Math.round(withCycle.reduce((s, c) => s + c.cycle, 0) / withCycle.length)
    : 0;
  const totalPipeline = closerData.reduce((s, c) => s + c.pipeline, 0);
  const totalWonWithSG = closerData.reduce((s, c) => s + c.wonWithSG, 0);
  const totalOppsWithSG = closerData.reduce((s, c) => s + c.oppsWithSG, 0);
  const totalWinRateSG = totalOppsWithSG > 0 ? (totalWonWithSG / totalOppsWithSG) * 100 : 0;

  const totalEG = egSgData?.total ?? 0;
  const totalSG = egSgData?.sgStattgefunden ?? 0;
  const totalEGNoShow = closerData.reduce((s, c) => s + c.egNoShow, 0);
  const pieData = [
    { name: "EG", value: totalEG },
    { name: "SG", value: totalSG },
    { name: "No Show", value: totalEGNoShow },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* KPI Cards */}
      <div>
        <p className="text-sm font-semibold mb-4">Revenue KPIs</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          <KpiCard label="Won Umsatz (MTD)" value={euro(totalUmsatz)} accent />
          <KpiCard label="Won Deals" value={totalWon} />
          <KpiCard label="Win Rate" value={pct(totalWinRate)} />
          <KpiCard label="Win Rate auf SG" value={pct(totalWinRateSG)} />
          <KpiCard label="EG→SG Rate" value={pct(egSgData?.rate ?? 0)} />
          <KpiCard label="Ø Deal Size" value={euro(avgDeal)} />
          <KpiCard label="Ø Sales Cycle" value={`${avgCycle} Tage`} />
          <KpiCard label="Umsatz pro EG" value={totalEG > 0 ? euro(totalUmsatz / totalEG) : "–"} />
        </div>
      </div>

      {/* 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Umsatz nach Monat">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenue ?? []} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }} name="Ist" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gespräche (EG / SG / No Show)">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, "Anzahl"]} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px]">
              <p className="text-sm text-muted-foreground">Keine Daten</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Closer Übersicht Table */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Closer Übersicht</p>
        <DataTable
          sortKey={sortCloser}
          onSort={setSortCloser}
          columns={[
            { key: "name", label: "Closer", bold: true },
            { key: "eg", label: "EG", right: true, mono: true },
            { key: "egNoShow", label: "EG No Show", right: true, mono: true },
            { key: "egShowRate", label: "EG Show Rate", right: true, render: (v: number) => pct(v) },
            { key: "sg", label: "SG", right: true, mono: true },
            { key: "sgNoShow", label: "SG No Show", right: true, mono: true },
            { key: "sgShowRate", label: "SG Show Rate", right: true, render: (v: number) => pct(v) },
            { key: "won", label: "Won", right: true, mono: true, bold: true },
            { key: "winRate", label: "Win Rate", right: true, render: (v: number) => pct(v) },
            { key: "winRateSG", label: "Win Rate SG", right: true, render: (v: number) => pct(v) },
            { key: "umsatz", label: "Umsatz MTD", right: true, mono: true, bold: true, render: (v: number) => euro(v) },
            { key: "avgDeal", label: "Ø Deal", right: true, mono: true, render: (v: number) => euro(v) },
            { key: "cycle", label: "Ø Cycle", right: true, render: (v: number) => `${v}d` },
            { key: "offeneOpps", label: "Offene Opps", right: true, mono: true },
            { key: "pipeline", label: "Pipeline", right: true, mono: true, render: (v: number) => euro(v) },
          ]}
          rows={sortedClosers}
          summaryRow={(() => {
            const totEg = closerData.reduce((s, c) => s + c.eg, 0);
            const totEgNo = closerData.reduce((s, c) => s + c.egNoShow, 0);
            const totSg = closerData.reduce((s, c) => s + c.sg, 0);
            const totSgNo = closerData.reduce((s, c) => s + c.sgNoShow, 0);
            const totLost = closerData.reduce((s, c) => s + c.lost, 0);
            const totOffene = closerData.reduce((s, c) => s + c.offeneOpps, 0);
            return {
              name: "Gesamt",
              eg: totEg,
              egNoShow: totEgNo,
              egShowRate: (totEg + totEgNo) > 0 ? (totEg / (totEg + totEgNo)) * 100 : 0,
              sg: totSg,
              sgNoShow: totSgNo,
              sgShowRate: (totSg + totSgNo) > 0 ? (totSg / (totSg + totSgNo)) * 100 : 0,
              won: totalWon,
              winRate: totalWinRate,
              winRateSG: totalWinRateSG,
              umsatz: totalUmsatz,
              avgDeal: avgDeal,
              cycle: avgCycle,
              offeneOpps: totOffene,
              pipeline: totalPipeline,
            };
          })()}
          avgRow={(() => {
            const n = closerData.length;
            if (n === 0) return undefined;
            return {
              name: "Ø Schnitt",
              eg: Math.round(closerData.reduce((s, c) => s + c.eg, 0) / n),
              egNoShow: Math.round(closerData.reduce((s, c) => s + c.egNoShow, 0) / n),
              egShowRate: closerData.reduce((s, c) => s + c.egShowRate, 0) / n,
              sg: Math.round(closerData.reduce((s, c) => s + c.sg, 0) / n),
              sgNoShow: Math.round(closerData.reduce((s, c) => s + c.sgNoShow, 0) / n),
              sgShowRate: closerData.reduce((s, c) => s + c.sgShowRate, 0) / n,
              won: Math.round(totalWon / n),
              winRate: closerData.reduce((s, c) => s + c.winRate, 0) / n,
              winRateSG: closerData.reduce((s, c) => s + c.winRateSG, 0) / n,
              umsatz: Math.round(totalUmsatz / n),
              avgDeal: closerData.reduce((s, c) => s + c.avgDeal, 0) / n,
              cycle: Math.round(closerData.reduce((s, c) => s + c.cycle, 0) / n),
              offeneOpps: Math.round(closerData.reduce((s, c) => s + c.offeneOpps, 0) / n),
              pipeline: Math.round(totalPipeline / n),
            };
          })()}
        />
      </Card>

    </div>
  );
}
