"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { useSearchStats, type KeywordStats } from "@/lib/hooks/use-search-stats";

type SortKey = keyof KeywordStats;
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "keyword", label: "Suchbegriff", align: "left" },
  { key: "total", label: "Gesamt", align: "right" },
  { key: "qualified", label: "Qualifiziert", align: "right" },
  { key: "withWebsite", label: "Webseite", align: "right" },
  { key: "withContact", label: "Ansprechpartner", align: "right" },
  { key: "conversionRate", label: "Conv. %", align: "right" },
  { key: "exported", label: "Exportiert", align: "right" },
  { key: "progress", label: "Fortschritt", align: "right" },
];

export default function SearchOverview() {
  const { stats, loading, error } = useSearchStats();
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (loading) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-sm font-semibold mb-4">Pipeline Uebersicht</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-muted rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600">Fehler: {error}</p>
      </Card>
    );
  }

  // Gesamt-Totals fuer KPI-Kacheln
  const totals = stats.reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      qualified: acc.qualified + s.qualified,
      withWebsite: acc.withWebsite + s.withWebsite,
      withContact: acc.withContact + s.withContact,
      exported: acc.exported + s.exported,
    }),
    { total: 0, qualified: 0, withWebsite: 0, withContact: 0, exported: 0 },
  );

  const cost = (totals.total / 1000) * 4;

  // Sortierung
  const sorted = [...stats].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  // Gesamt-Reihe: gewichteter Fortschritt + Conversionrate
  const totalTerminal = stats.reduce((sum, s) => {
    const terminal = s.total > 0 ? (s.progress / 100) * s.total : 0;
    return sum + terminal;
  }, 0);
  const totalProgress = totals.total > 0 ? (totalTerminal / totals.total) * 100 : 100;
  const totalConversion =
    totals.withWebsite > 0 ? (totals.withContact / totals.withWebsite) * 100 : 0;

  return (
    <Card className="p-6 animate-fade-in">
      {/* KPI-Kacheln */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiTile label="Suchbegriffe" value={stats.length.toString()} />
        <KpiTile label="Scraped" value={formatNumber(totals.total)} />
        <KpiTile label="Exportiert" value={formatNumber(totals.exported)} />
        <KpiTile label="Kosten" value={`${cost.toFixed(2)} \u20AC`} sub="4 \u20AC / 1.000 Leads" />
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "pb-3 pr-4 cursor-pointer select-none hover:text-foreground whitespace-nowrap text-xs font-medium transition-colors",
                    col.align === "right" && "text-right",
                  )}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key ? (
                    <span className="ml-0.5 text-foreground">
                      {sortDir === "asc" ? "\u2191" : "\u2193"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30 ml-0.5">&#8597;</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.keyword}
                className="border-b last:border-0 hover:bg-accent/50 transition-colors"
              >
                <td className="py-2.5 pr-4 font-medium">{row.keyword}</td>
                <td className="py-2.5 pr-4 text-right font-bold tabnum">
                  {formatNumber(row.total)}
                </td>
                <NumCell value={row.qualified} />
                <NumCell value={row.withWebsite} />
                <NumCell value={row.withContact} />
                <td className="py-2.5 pr-4 text-right tabnum">
                  {row.conversionRate > 0 ? `${row.conversionRate.toFixed(1)}%` : <Dash />}
                </td>
                <NumCell value={row.exported} />
                <td className="py-2.5 pr-4 text-right tabnum">{row.progress.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 font-semibold">
              <td className="py-2.5 pr-4">Gesamt</td>
              <td className="py-2.5 pr-4 text-right tabnum">{formatNumber(totals.total)}</td>
              <td className="py-2.5 pr-4 text-right tabnum">{formatNumber(totals.qualified)}</td>
              <td className="py-2.5 pr-4 text-right tabnum">{formatNumber(totals.withWebsite)}</td>
              <td className="py-2.5 pr-4 text-right tabnum">{formatNumber(totals.withContact)}</td>
              <td className="py-2.5 pr-4 text-right tabnum">
                {totalConversion > 0 ? `${totalConversion.toFixed(1)}%` : <Dash />}
              </td>
              <td className="py-2.5 pr-4 text-right tabnum">{formatNumber(totals.exported)}</td>
              <td className="py-2.5 pr-4 text-right tabnum">{totalProgress.toFixed(0)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

// --- Subkomponenten ---

interface KpiTileProps {
  label: string;
  value: string;
  sub?: string;
}

function KpiTile({ label, value, sub }: KpiTileProps) {
  return (
    <div className="rounded-lg ring-1 ring-border px-4 py-3 bg-muted/30">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold tabnum mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</div>}
    </div>
  );
}

function NumCell({ value }: { value: number }) {
  return (
    <td className="py-2.5 pr-4 text-right tabnum">{value > 0 ? formatNumber(value) : <Dash />}</td>
  );
}

function Dash() {
  return <span className="text-muted-foreground/30">&mdash;</span>;
}
