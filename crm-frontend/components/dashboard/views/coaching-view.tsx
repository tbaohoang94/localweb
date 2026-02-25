"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import DataTable from "@/components/dashboard/data-table";
import BadgeStatus from "@/components/dashboard/badge-status";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { euro } from "@/lib/formatters";
import { fetchCoachingCalls, fetchWonDeals, fetchIndustryBreakdown } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import type { Filters } from "@/lib/constants";
import CustomTooltip from "./shared-tooltip";

export default function CoachingView({ filters }: { filters: Filters }) {
  const [notes, setNotes] = useState(
    "Fokus diese Woche: No-Show-Rate senken. Einwandbehandlung trainieren."
  );
  const [actions, setActions] = useState([
    { id: 1, text: "Script für Preiseinwand überarbeiten", done: true },
    { id: 2, text: "3 Roleplay-Sessions bis Freitag", done: false },
    { id: 3, text: "Weekly Review Meeting vorbereiten", done: false },
  ]);

  const { data: callsData, loading: l1, error: e1 } = useDashboardQuery(fetchCoachingCalls, filters);
  const { data: wonData, loading: l2, error: e2 } = useDashboardQuery(fetchWonDeals, filters);
  const { data: industryData, loading: l3, error: e3 } = useDashboardQuery(fetchIndustryBreakdown, filters);

  const toggle = (id: number) =>
    setActions((a) => a.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const anyError = e1 || e2 || e3;
  if (anyError) return <ErrorCard message={anyError} />;

  const loading = l1 || l2 || l3;
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  const calls = callsData ?? [];
  const wonDeals = wonData ?? [];
  const industryBreakdown = industryData ?? [];

  const totalWon = wonDeals.length;
  const totalUmsatz = wonDeals.reduce((s, d) => s + d.value, 0);
  const avgDeal = totalWon > 0 ? totalUmsatz / totalWon : 0;
  const avgCycle = totalWon > 0
    ? Math.round(wonDeals.reduce((s, d) => s + d.cycle, 0) / totalWon)
    : 0;

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
        <KpiCard label="Calls (Zeitraum)" value={calls.length} accent />
        <KpiCard label="Won Deals" value={totalWon} />
        <KpiCard label="Gesamtumsatz" value={euro(totalUmsatz)} />
        <KpiCard label="Ø Deal Size" value={euro(avgDeal)} />
        <KpiCard label="Ø Sales Cycle" value={`${avgCycle} Tage`} />
      </div>

      {/* Calls Table + Side Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4">Gespräche (letzte 20)</p>
          <DataTable
            columns={[
              { key: "date", label: "Datum", bold: true },
              { key: "lead", label: "Lead" },
              { key: "duration", label: "Dauer" },
              {
                key: "outcome",
                label: "Outcome",
                render: (v: string) => (
                  <BadgeStatus
                    label={v}
                    type={
                      v === "answered"
                        ? "success"
                        : v === "missed"
                        ? "danger"
                        : v === "voicemail"
                        ? "warning"
                        : "default"
                    }
                  />
                ),
              },
            ]}
            rows={calls}
          />
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5 flex-1">
            <p className="text-sm font-semibold mb-3">Coaching Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[130px] rounded-lg border bg-muted/50 p-3 text-sm resize-y outline-none focus:ring-2 focus:ring-ring leading-relaxed"
            />
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold mb-3">Action Items</p>
            <div className="flex flex-col gap-2.5">
              {actions.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2.5 cursor-pointer group"
                  onClick={() => toggle(a.id)}
                >
                  <div
                    className={`w-[18px] h-[18px] rounded shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all ${
                      a.done
                        ? "border-primary bg-primary"
                        : "border-border group-hover:border-primary/50"
                    }`}
                  >
                    {a.done && <span className="text-primary-foreground text-[11px]">✓</span>}
                  </div>
                  <p
                    className={`text-sm ${
                      a.done
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {a.text}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Won Deal Analytics */}
      <div>
        <p className="text-sm font-semibold mb-4">Won Deal Analytics</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children mb-4">
          <KpiCard label="Won Deals" value={totalWon} accent />
          <KpiCard label="Gesamtumsatz" value={euro(totalUmsatz)} />
          <KpiCard label="Ø Order Size" value={euro(avgDeal)} />
          <KpiCard label="Ø Sales Cycle" value={`${avgCycle}d`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Branchen Breakdown">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={industryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="industry" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} name="Umsatz">
                  {industryBreakdown.map((_, i) => (
                    <Cell key={i} fill={`hsl(217 91% ${60 - i * 8}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <Card className="p-5">
            <p className="text-sm font-semibold mb-4">Won Deals</p>
            <DataTable
              columns={[
                { key: "name", label: "Deal", bold: true },
                { key: "rep", label: "Closer" },
                { key: "value", label: "Wert", right: true, mono: true, bold: true, render: (v: number) => euro(v) },
                { key: "industry", label: "Branche", render: (v: string) => <BadgeStatus label={v} /> },
                { key: "cycle", label: "Cycle", right: true, render: (v: number) => `${v}d` },
              ]}
              rows={wonDeals}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
