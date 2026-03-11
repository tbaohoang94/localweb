"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import ErrorCard from "@/components/dashboard/error-card";
import BadgeStatus from "@/components/dashboard/badge-status";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { euro } from "@/lib/formatters";
import { fetchCallerProvisionTransactions, fetchColdcallerKPIs } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import DataTable from "@/components/dashboard/data-table";
import type { Filters } from "@/lib/constants";
import CustomTooltip from "./shared-tooltip";

const PAGE_SIZE = 20;

// Monthly provision derived from transactions client-side
function buildMonthly(txns: { date: string; amount: number }[]) {
  const map = new Map<string, number>();
  for (const t of txns) {
    const parts = t.date.split(".");
    if (parts.length !== 2) continue;
    // date is DD.MM format from formatDateShort
    const key = parts[1]; // month number
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return Array.from(map.entries()).map(([m, prov]) => ({ m, prov }));
}

export default function ProvisionenCallerView({ filters }: { filters: Filters }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: txns, loading: l1, error: e1 } = useDashboardQuery(fetchCallerProvisionTransactions, filters);
  const allFilters = { ...filters, rep: "Alle" };
  const { data: callerKPIs, loading: l2, error: e2 } = useDashboardQuery(fetchColdcallerKPIs, allFilters);

  const error = e1 || e2;
  const loading = l1 || l2;

  if (error) return <ErrorCard message={error} />;
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  const transactions = txns ?? [];
  const totalMTD = transactions.reduce((s, t) => s + t.amount, 0);
  const egShows = transactions.filter((t) => t.type === "EG stattgefunden").length;
  const noShows = transactions.filter((t) => t.type === "EG no show").length;
  const neukunden = transactions.filter((t) => t.type === "Neukunde").length;
  const visible = transactions.slice(0, visibleCount);
  const monthly = buildMonthly(transactions);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
        <KpiCard label="Provision MTD" value={euro(totalMTD)} accent />
        <KpiCard label="EG Show" value={egShows} />
        <KpiCard label="EG No Show" value={noShows} />
        <KpiCard label="Neukunden" value={neukunden} />
        <KpiCard
          label="Ø pro Event"
          value={euro(transactions.length > 0 ? Math.round(totalMTD / transactions.length) : 0)}
        />
      </div>

      {/* Uebersicht alle Caller */}
      {(callerKPIs ?? []).length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4">Provision pro Coldcaller</p>
          <DataTable
            columns={[
              { key: "name", label: "Coldcaller", bold: true },
              { key: "egStattgefunden", label: "EG Show", right: true, mono: true },
              { key: "noShow", label: "EG No Show", right: true, mono: true },
              { key: "neukunden", label: "Neukunden", right: true, mono: true },
              { key: "provision", label: "Provision", right: true, mono: true, render: (v: number) => <span className={`font-semibold ${v >= 0 ? "text-success" : "text-destructive"}`}>{euro(v)}</span> },
            ]}
            rows={[
              ...(callerKPIs ?? []),
              {
                userId: "_total",
                closeUserId: "",
                name: "Gesamt",
                talkTime: 0, bruttoCalls: 0, nettoCalls: 0,
                terminGelegt: 0, terminGelegtET: 0, terminGelegtFT: 0, terminQuote: 0,
                showUpRate: 0, erreichbarkeitsQuote: 0,
                egStattgefunden: (callerKPIs ?? []).reduce((s, r) => s + r.egStattgefunden, 0),
                noShow: (callerKPIs ?? []).reduce((s, r) => s + r.noShow, 0),
                neukunden: (callerKPIs ?? []).reduce((s, r) => s + r.neukunden, 0),
                provision: (callerKPIs ?? []).reduce((s, r) => s + r.provision, 0),
              },
            ]}
          />
        </Card>
      )}

      {/* Monthly Trend */}
      {monthly.length > 0 && (
        <ChartCard title="Monatlicher Verlauf">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gProvCaller" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="prov" stroke="hsl(var(--primary))" fill="url(#gProvCaller)" strokeWidth={2.5} name="Provision" dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Transactions */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Transaktionen / Events</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground font-semibold border-b">
                <th className="pb-2 pr-4">Datum</th>
                <th className="pb-2 pr-4">Typ</th>
                <th className="pb-2 pr-4">Lead</th>
                <th className="pb-2 text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{t.date}</td>
                  <td className="py-2.5 pr-4">
                    <BadgeStatus
                      label={t.type}
                      type={t.type === "EG no show" ? "warning" : t.type === "Neukunde" ? "default" : "success"}
                    />
                  </td>
                  <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                    {t.closeLeadId ? (
                      <a
                        href={`https://app.close.com/lead/${t.closeLeadId}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {t.ref}
                      </a>
                    ) : (
                      t.ref
                    )}
                  </td>
                  <td className={`py-2.5 text-right tabnum font-semibold ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>
                    {euro(t.amount)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">Keine Daten für diesen Filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {visibleCount < transactions.length && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
              Mehr laden ({transactions.length - visibleCount} verbleibend)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
