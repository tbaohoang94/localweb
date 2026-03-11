"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
import DataTable from "@/components/dashboard/data-table";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCustomActivities, fetchActivityKPIs, fetchActivityTypes } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import { createClient } from "@/lib/supabase-browser";
import type { Filters } from "@/lib/constants";
import type { CustomActivityRow } from "@/lib/types/dashboard";

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
      timeZone: "Europe/Berlin",
    });
  } catch {
    return iso;
  }
}

export default function CustomActivitiesView({ filters }: { filters: Filters }) {
  const [typeFilter, setTypeFilter] = useState("Alle");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activityTypes, setActivityTypes] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const supabaseRef = useRef(createClient());

  // Activity Types einmalig laden
  useEffect(() => {
    fetchActivityTypes(supabaseRef.current).then(setActivityTypes).catch(console.error);
  }, []);

  const { data: activities, loading: loadingActivities, error: errorActivities } = useDashboardQuery(fetchCustomActivities, filters);
  const { data: kpis, loading: loadingKPIs, error: errorKPIs } = useDashboardQuery(fetchActivityKPIs, filters);

  // Reset Pagination bei Filterwechsel
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setSelected(new Set());
  }, [filters.from, filters.to, filters.rep, typeFilter]);

  // Client-side Type-Filter + geloeschte ausblenden
  const filtered = useMemo(() => {
    let list = activities ?? [];
    list = list.filter((a) => !deletedIds.has(a.id));
    if (typeFilter === "Alle") return list;
    return list.filter((a) => a.typeId === typeFilter);
  }, [activities, typeFilter, deletedIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabaseRef.current
        .from("custom_activities")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", ids);
      if (error) {
        console.error("[CustomActivities] Soft-Delete fehlgeschlagen", error);
        alert("Loeschen fehlgeschlagen: " + error.message);
      } else {
        setDeletedIds((prev) => new Set([...prev, ...ids]));
        setSelected(new Set());
      }
    } finally {
      setDeleting(false);
    }
  }, [selected]);

  if (errorActivities || errorKPIs) return <ErrorCard message={errorActivities ?? errorKPIs ?? "Fehler"} />;

  const loading = loadingActivities || loadingKPIs;

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

  const paged = filtered.slice(0, visibleCount);
  const k = kpis ?? { egVereinbart: 0, egNoShow: 0, egStattgefunden: 0, sgStattgefunden: 0, sgNoShow: 0, kundeGewonnen: 0 };

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        <KpiCard label="EG vereinbart" value={k.egVereinbart} accent />
        <KpiCard label="EG No Show" value={k.egNoShow} />
        <KpiCard label="EG stattgefunden" value={k.egStattgefunden} />
        <KpiCard label="SG stattgefunden" value={k.sgStattgefunden} />
        <KpiCard label="SG No Show" value={k.sgNoShow} />
        <KpiCard label="Kunde gewonnen" value={k.kundeGewonnen} />
      </div>

      {/* Activity Type Filter + Delete Button */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">Activity Type:</span>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[220px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Alle">Alle Typen</SelectItem>
            {activityTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} Eintraege
        </span>
        {selected.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Loesche..." : `${selected.size} loeschen`}
          </Button>
        )}
      </div>

      {/* Tabelle */}
      <Card className="p-5">
        <DataTable
          columns={[
            {
              key: "_select",
              label: "",
              render: (_: unknown, row: CustomActivityRow) => (
                <Checkbox
                  checked={selected.has(row.id)}
                  onCheckedChange={() => toggleSelect(row.id)}
                />
              ),
            },
            {
              key: "leadName",
              label: "Lead Name",
              bold: true,
              render: (v: string, row: CustomActivityRow) =>
                row.closeLeadId ? (
                  <a
                    href={`https://app.close.com/lead/${row.closeLeadId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    {v}
                  </a>
                ) : (
                  v
                ),
            },
            { key: "activityType", label: "Activity Type" },
            { key: "updatedAt", label: "Erstellt am", render: (v: string) => formatTimestamp(v) },
            { key: "createdBy", label: "Created By" },
          ]}
          rows={paged}
        />
        {filtered.length > visibleCount && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Mehr laden ({filtered.length - visibleCount} verbleibend)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
