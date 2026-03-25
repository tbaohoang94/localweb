"use client";

import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import DataTable from "@/components/dashboard/data-table";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { euro, pct, num, minsToHHMM } from "@/lib/formatters";
import {
  fetchRevenueByMonth, fetchPipelineStages,
  fetchCloserKPIs, fetchColdcallerKPIs, fetchEgToSgRate,
} from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import type { Filters } from "@/lib/constants";
import CustomTooltip from "./shared-tooltip";

export default function ControllingView({ filters }: { filters: Filters }) {
  const [closerSort, setCloserSort] = useState("umsatz");
  const [coldSort, setColdSort] = useState("bruttoCalls");

  const { data: revenue, loading: l1, error: e1 } = useDashboardQuery(fetchRevenueByMonth, filters);
  const { data: stages, loading: l2, error: e2 } = useDashboardQuery(fetchPipelineStages, filters);
  const { data: closers, loading: l3, error: e3 } = useDashboardQuery(fetchCloserKPIs, filters);
  const { data: callers, loading: l4, error: e4 } = useDashboardQuery(fetchColdcallerKPIs, filters);
  const { data: egSgData, loading: l5, error: e5 } = useDashboardQuery(fetchEgToSgRate, filters);

  const anyError = e1 || e2 || e3 || e4 || e5;
  if (anyError) return <ErrorCard message={anyError} />;

  const loading = l1 || l2 || l3 || l4 || l5;
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const revenueMonths = revenue ?? [];
  const pipelineStages = stages ?? [];
  const closerData = closers ?? [];
  const coldcallerData = callers ?? [];

  const sortedClosers = [...closerData].sort((a, b) => (b[closerSort as keyof typeof b] as number) - (a[closerSort as keyof typeof a] as number));
  const sortedCold = [...coldcallerData].sort((a, b) => (b[coldSort as keyof typeof b] as number) - (a[coldSort as keyof typeof a] as number));

  const totalUmsatz = closerData.reduce((s, c) => s + c.umsatz, 0);
  const totalWon = closerData.reduce((s, c) => s + c.won, 0);
  const totalLost = closerData.reduce((s, c) => s + c.lost, 0);
  const totalActive = closerData.reduce((s, c) => s + c.offeneOpps, 0);
  const totalOpps = totalWon + totalLost + totalActive;
  const totalWinRate = totalOpps > 0 ? (totalWon / totalOpps) * 100 : 0;
  const avgDeal = totalWon > 0 ? totalUmsatz / totalWon : 0;
  const totalPipeline = closerData.reduce((s, c) => s + c.pipeline, 0);
  const avgCycle = closerData.filter((c) => c.cycle > 0).length > 0
    ? Math.round(closerData.reduce((s, c) => s + c.cycle, 0) / closerData.filter((c) => c.cycle > 0).length)
    : 0;
  const totalEG = closerData.reduce((s, c) => s + c.eg, 0);
  const totalEGNoShow = closerData.reduce((s, c) => s + c.egNoShow, 0);
  const egShowRate = (totalEG + totalEGNoShow) > 0 ? (totalEG / (totalEG + totalEGNoShow)) * 100 : 0;
  const totalWonWithSG = closerData.reduce((s, c) => s + c.wonWithSG, 0);
  const totalOppsWithSG = closerData.reduce((s, c) => s + c.oppsWithSG, 0);
  const avgWinRateSG = totalOppsWithSG > 0 ? (totalWonWithSG / totalOppsWithSG) * 100 : 0;

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* KPI Cards */}
      <div>
        <p className="text-sm font-semibold mb-4">Key Performance Indicators</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          <KpiCard label="Umsatz MTD" value={euro(totalUmsatz)} accent />
          <KpiCard label="Won Deals" value={totalWon} />
          <KpiCard label="Pipeline Value" value={euro(totalPipeline)} />
          <KpiCard label="EG Show Rate" value={pct(egShowRate)} />
          <KpiCard label="Win Rate" value={pct(totalWinRate)} />
          <KpiCard label="Ø Deal Size" value={euro(avgDeal)} />
          <KpiCard label="EG→SG Rate" value={pct(egSgData?.rate ?? 0)} />
          <KpiCard label="Ø Win Rate SG" value={pct(avgWinRateSG)} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue Trend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueMonths} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }} name="Ist" />
              <Legend iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Pipeline Health nach Stage"
          footer={
            <div>
              <p className="text-xs text-muted-foreground">Weighted Pipeline</p>
              <p className="text-xl font-bold tabnum">{euro(totalPipeline)}</p>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipelineStages} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" horizontal={false} />
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
        </ChartCard>
      </div>

      {/* Closer Performance */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Closer Performance</p>
        <DataTable
          sortKey={closerSort}
          onSort={setCloserSort}
          columns={[
            { key: "name", label: "Name", bold: true },
            { key: "umsatz", label: "Umsatz", right: true, mono: true, bold: true, render: (v: number) => euro(v) },
            { key: "won", label: "Deals Won", right: true, mono: true, bold: true },
            { key: "offeneOpps", label: "Offene Deals", right: true, mono: true },
            { key: "pipeline", label: "Pipeline", right: true, mono: true, render: (v: number) => euro(v) },
            { key: "winRate", label: "Win Rate", right: true, mono: true, render: (v: number) => pct(v) },
            { key: "sgShowRate", label: "SG Show Rate", right: true, mono: true, render: (v: number) => pct(v) },
            { key: "winRateSG", label: "Win Rate SG", right: true, mono: true, render: (v: number) => pct(v) },
            { key: "avgDeal", label: "Ø Deal", right: true, mono: true, render: (v: number) => euro(v) },
            { key: "cycle", label: "Cycle", right: true, render: (v: number) => `${v}d` },
            { key: "projectedUmsatz", label: "Projected Umsatz", right: true, mono: true, bold: true, render: (v: number) => euro(v) },
          ]}
          rows={sortedClosers}
          summaryRow={{
            name: "Gesamt",
            umsatz: totalUmsatz,
            won: totalWon,
            offeneOpps: totalActive,
            pipeline: totalPipeline,
            winRate: totalWinRate,
            sgShowRate: (() => { const sg = closerData.reduce((s, c) => s + c.sg, 0); const sgNo = closerData.reduce((s, c) => s + c.sgNoShow, 0); return (sg + sgNo) > 0 ? (sg / (sg + sgNo)) * 100 : 0; })(),
            winRateSG: avgWinRateSG,
            avgDeal: avgDeal,
            cycle: avgCycle,
            projectedUmsatz: closerData.reduce((s, c) => s + c.projectedUmsatz, 0),
          }}
        />
      </Card>

      {/* Coldcaller Performance */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Coldcaller Performance</p>
        <DataTable
          sortKey={coldSort}
          onSort={setColdSort}
          columns={[
            { key: "name", label: "Name", bold: true },
            { key: "talkTime", label: "Gesprächszeit", right: true, mono: true, render: (v: number) => minsToHHMM(v) },
            { key: "bruttoCalls", label: "Bruttocalls", right: true, mono: true },
            { key: "nettoCalls", label: "Nettocalls", right: true, mono: true },
            { key: "terminGelegt", label: "Meetings", right: true, mono: true, bold: true },
            { key: "terminQuote", label: "Terminquote", right: true, render: (v: number) => pct(v) },
            { key: "egStattgefunden", label: "EG Shows", right: true, mono: true },
            { key: "noShow", label: "No Show", right: true, mono: true },
            { key: "showUpRate", label: "Show up Rate", right: true, render: (v: number) => pct(v) },
            { key: "neukunden", label: "Neukunden", right: true, mono: true },
          ]}
          rows={sortedCold}
          summaryRow={(() => {
            const totTalk = coldcallerData.reduce((s, c) => s + c.talkTime, 0);
            const totBrutto = coldcallerData.reduce((s, c) => s + c.bruttoCalls, 0);
            const totNetto = coldcallerData.reduce((s, c) => s + c.nettoCalls, 0);
            const totTermin = coldcallerData.reduce((s, c) => s + c.terminGelegt, 0);
            const totEgShows = coldcallerData.reduce((s, c) => s + c.egStattgefunden, 0);
            const totNoShow = coldcallerData.reduce((s, c) => s + c.noShow, 0);
            const totNeukunden = coldcallerData.reduce((s, c) => s + c.neukunden, 0);
            return {
              name: "Gesamt",
              talkTime: totTalk,
              bruttoCalls: totBrutto,
              nettoCalls: totNetto,
              terminGelegt: totTermin,
              terminQuote: totNetto > 0 ? (totTermin / totNetto) * 100 : 0,
              egStattgefunden: totEgShows,
              noShow: totNoShow,
              showUpRate: totTermin > 0 ? (totEgShows / totTermin) * 100 : 0,
              neukunden: totNeukunden,
            };
          })()}
        />
      </Card>
    </div>
  );
}
