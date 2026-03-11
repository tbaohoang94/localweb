"use client";

import { useState } from "react";
import BadgeStatus from "@/components/dashboard/badge-status";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSyncLogs } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import type { Filters } from "@/lib/constants";

const PAGE_SIZE = 25;

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "–";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function statusType(status: string): "success" | "danger" | "warning" | "default" {
  if (status === "success") return "success";
  if (status === "error") return "danger";
  if (status === "running") return "warning";
  return "default";
}

export default function LogsView({ filters }: { filters: Filters }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: logs, loading, error } = useDashboardQuery(fetchSyncLogs, filters);

  if (error) return <ErrorCard message={error} />;

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const entries = logs ?? [];
  const visible = entries.slice(0, visibleCount);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entries.length} Log-Eintraege
        </p>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground font-semibold border-b">
                <th className="pb-2 pr-4">Zeitpunkt</th>
                <th className="pb-2 pr-4">Entity</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4 text-right">Records</th>
                <th className="pb-2 pr-4 text-right">Dauer</th>
                <th className="pb-2">Fehler</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap tabnum">
                    {formatTimestamp(log.startedAt)}
                  </td>
                  <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                    {log.entity}
                  </td>
                  <td className="py-2.5 pr-4">
                    <BadgeStatus label={log.status} type={statusType(log.status)} />
                  </td>
                  <td className="py-2.5 pr-4 text-right tabnum text-muted-foreground">
                    {log.recordsSynced ?? "–"}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabnum text-muted-foreground">
                    {formatDuration(log.durationSec)}
                  </td>
                  <td className="py-2.5 max-w-xs truncate text-destructive text-xs">
                    {log.errorMessage ?? ""}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Keine Logs fuer diesen Zeitraum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {visibleCount < entries.length && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Mehr laden ({entries.length - visibleCount} verbleibend)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
