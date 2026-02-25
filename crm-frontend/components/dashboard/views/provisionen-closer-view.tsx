"use client";

import { useState, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ExternalLink, Download } from "lucide-react";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { euro } from "@/lib/formatters";
import { fetchCloserProvisionTransactions, fetchMonthlyProvision } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import type { Filters } from "@/lib/constants";
import type { ProvisionTransaction } from "@/lib/types/dashboard";
import CustomTooltip from "./shared-tooltip";

const PAGE_SIZE = 20;

function exportCsv(rows: ProvisionTransaction[]) {
  const header = "Datum;Lead;Einrichtung;Laufzeit;Monatlich;Empfehlung;Provision;Quelle;Vertrags-URL";
  const lines = rows.map((t) =>
    [
      t.date,
      t.ref.split(" / ").pop() ?? t.ref,
      (t.setupFee ?? 0).toString().replace(".", ","),
      `${t.contractDuration ?? 0}`,
      (t.monthlyValue ?? 0).toString().replace(".", ","),
      (t.empfehlungBonus ?? 0).toString().replace(".", ","),
      t.amount.toString().replace(".", ","),
      t.source ?? "",
      t.contractUrl ?? "",
    ].join(";")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "provision-closer.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProvisionenCloserView({ filters }: { filters: Filters }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: txns, loading: l1, error: e1 } = useDashboardQuery(fetchCloserProvisionTransactions, filters);
  const { data: monthly, loading: l2, error: e2 } = useDashboardQuery(fetchMonthlyProvision, filters);

  const anyError = e1 || e2;
  if (anyError) return <ErrorCard message={anyError ?? "Fehler"} />;

  const loading = l1 || l2;
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  const transactions = txns ?? [];
  const totalMTD = transactions.reduce((s, t) => s + t.amount, 0);
  const totalUmsatz = transactions.reduce((s, t) => {
    const computed = (t.setupFee ?? 0) + (t.contractDuration ?? 0) * (t.monthlyValue ?? 0);
    return s + (computed > 0 ? computed : (t.oppValue ?? 0));
  }, 0);
  const totalSetupFee = transactions.reduce((s, t) => s + (t.setupFee ?? 0), 0);
  const totalMonthly = transactions.reduce((s, t) => s + (t.monthlyValue ?? 0), 0) * 12;
  const totalEmpfehlung = transactions.reduce((s, t) => s + (t.empfehlungBonus ?? 0), 0);
  const visible = transactions.slice(0, visibleCount);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 stagger-children">
        <KpiCard label="Provision MTD" value={euro(totalMTD)} accent />
        <KpiCard label="Won Deals" value={transactions.length} />
        <KpiCard label="Gesamtumsatz" value={euro(totalUmsatz)} />
        <KpiCard label="Einrichtungsgebühr" value={euro(totalSetupFee)} />
        <KpiCard label="Lfd. Jahreseinnahmen" value={euro(totalMonthly)} />
        <KpiCard label="Empfehlungsbonus" value={euro(totalEmpfehlung)} />
        <KpiCard
          label="Ø pro Deal"
          value={euro(transactions.length > 0 ? Math.round(totalMTD / transactions.length) : 0)}
        />
      </div>

      {/* Monthly Trend */}
      <ChartCard title="Monatlicher Verlauf">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthly ?? []}>
            <defs>
              <linearGradient id="gProvCloser" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="prov" stroke="hsl(var(--success))" fill="url(#gProvCloser)" strokeWidth={2.5} name="Provision" dot={{ r: 4, fill: "hsl(var(--success))" }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Transactions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Transaktionen / Events</p>
          <Button variant="outline" size="sm" onClick={() => exportCsv(transactions)}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            CSV Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground font-semibold border-b">
                <th className="pb-2 pr-4">Datum</th>
                <th className="pb-2 pr-4">Lead</th>
                <th className="pb-2 pr-4 text-right">Einrichtung</th>
                <th className="pb-2 pr-4 text-right">Laufzeit</th>
                <th className="pb-2 pr-4 text-right">Monatlich</th>
                <th className="pb-2 pr-4 text-right">Empfehlung</th>
                <th className="pb-2 pr-4 text-right">Provision</th>
                <th className="pb-2 text-center">Vertrag</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{t.date}</td>
                  <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                    {t.closeLeadId ? (
                      <a
                        href={`https://app.close.com/lead/${t.closeLeadId}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {t.ref.split(" / ").pop() ?? t.ref}
                      </a>
                    ) : (
                      t.ref
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabnum text-muted-foreground">{euro(t.setupFee ?? 0)}</td>
                  <td className="py-2.5 pr-4 text-right tabnum text-muted-foreground">{t.contractDuration ?? 0} Mo.</td>
                  <td className="py-2.5 pr-4 text-right tabnum text-muted-foreground">{euro(t.monthlyValue ?? 0)}</td>
                  <td className="py-2.5 pr-4 text-right tabnum text-muted-foreground">
                    {(t.empfehlungBonus ?? 0) > 0 ? (
                      <span className="text-success font-semibold">{euro(t.empfehlungBonus!)}</span>
                    ) : "–"}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabnum font-semibold text-success">{euro(t.amount)}</td>
                  <td className="py-2.5 text-center">
                    {t.contractUrl ? (
                      <a href={t.contractUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">Keine Daten für diesen Filter.</td>
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
