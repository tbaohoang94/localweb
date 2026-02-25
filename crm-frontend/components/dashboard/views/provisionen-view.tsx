"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import DataTable from "@/components/dashboard/data-table";
import BadgeStatus from "@/components/dashboard/badge-status";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { euro } from "@/lib/formatters";
import { fetchProvisionTransactions, fetchMonthlyProvision } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import type { Filters } from "@/lib/constants";
import CustomTooltip from "./shared-tooltip";

const barColors = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
];

export default function ProvisionenView({ filters }: { filters: Filters }) {
  const { data: txns, loading: l1, error: e1 } = useDashboardQuery(fetchProvisionTransactions, filters);
  const { data: monthlyProv, loading: l2, error: e2 } = useDashboardQuery(fetchMonthlyProvision, filters);

  const breakdown = useMemo(() => {
    const arr = txns ?? [];
    const map = new Map<string, number>();
    for (const t of arr) {
      map.set(t.type, (map.get(t.type) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [txns]);

  const anyError = e1 || e2;
  if (anyError) return <ErrorCard message={anyError} />;

  const loading = l1 || l2;
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    );
  }

  const transactions = txns ?? [];
  const monthly = monthlyProv ?? [];

  const totalMTD = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <KpiCard label="Provision MTD" value={euro(totalMTD)} accent />
        <KpiCard label="Transaktionen" value={transactions.length} />
        <KpiCard
          label="Ø pro Transaktion"
          value={euro(transactions.length > 0 ? Math.round(totalMTD / transactions.length) : 0)}
        />
        <Card className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Top Kategorie
          </p>
          <p className="text-xl font-bold tabnum">{breakdown[0]?.name ?? "–"}</p>
          <p className="text-sm text-muted-foreground">{breakdown[0] ? euro(breakdown[0].amount) : "–"}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Provisions-Breakdown">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => euro(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[5, 5, 0, 0]} name="Betrag">
                {breakdown.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monatlicher Verlauf">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gProv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="prov" stroke="hsl(var(--success))" fill="url(#gProv)" strokeWidth={2.5} name="Provision" dot={{ r: 4, fill: "hsl(var(--success))" }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Transactions */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Transaktionen / Events</p>
        <DataTable
          columns={[
            { key: "date", label: "Datum", bold: true },
            {
              key: "type",
              label: "Typ",
              render: (v: string) => (
                <BadgeStatus
                  label={v}
                  type={v.includes("No Show") ? "warning" : v.includes("Meeting") ? "info" : "success"}
                />
              ),
            },
            { key: "ref", label: "Referenz" },
            { key: "amount", label: "Betrag", right: true, mono: true, bold: true, render: (v: number) => euro(v) },
          ]}
          rows={transactions}
        />
      </Card>
    </div>
  );
}
