"use client";

import { useState, useMemo } from "react";
import DataTable from "@/components/dashboard/data-table";
import BadgeStatus from "@/components/dashboard/badge-status";
import ErrorCard from "@/components/dashboard/error-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchColdcallerCalls, fetchSettingActivities } from "@/lib/dashboard-queries";
import { useDashboardQuery } from "@/hooks/use-dashboard-data";
import type { Filters } from "@/lib/constants";
import { EG_ERGEBNIS_VALUES } from "@/lib/close-field-mappings";

const ERGEBNIS_OPTIONS = [
  { value: "Alle", label: "Alle Ergebnisse" },
  { value: EG_ERGEBNIS_VALUES.KUNDE, label: "Kunde" },
  { value: EG_ERGEBNIS_VALUES.FOLGETERMIN, label: "Folgetermin" },
  { value: EG_ERGEBNIS_VALUES.FOLLOW_UP, label: "Follow-up" },
  { value: EG_ERGEBNIS_VALUES.VERLOREN, label: "Verloren" },
  { value: EG_ERGEBNIS_VALUES.UNQUALIFIZIERT, label: "Unqualifiziert" },
];

export default function CoachingView({ filters }: { filters: Filters }) {
  const [ergebnisFilter, setErgebnisFilter] = useState("Alle");

  const { data: callsData, loading: l1, error: e1 } = useDashboardQuery(fetchColdcallerCalls, filters);
  const { data: settingData, loading: l2, error: e2 } = useDashboardQuery(fetchSettingActivities, filters);

  const filteredSettings = useMemo(() => {
    const list = settingData ?? [];
    if (ergebnisFilter === "Alle") return list;
    return list.filter((s) => s.ergebnis === ergebnisFilter);
  }, [settingData, ergebnisFilter]);

  const anyError = e1 || e2;
  if (anyError) return <ErrorCard message={anyError} />;

  const loading = l1 || l2;
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <Skeleton className="h-10 w-[400px] rounded-lg" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  const calls = callsData ?? [];

  return (
    <div className="p-6 flex flex-col gap-6">
      <Tabs defaultValue="coldcaller">
        <TabsList>
          <TabsTrigger value="coldcaller">Coldcaller</TabsTrigger>
          <TabsTrigger value="setting">Setting</TabsTrigger>
          <TabsTrigger value="closing">Closing</TabsTrigger>
        </TabsList>

        {/* Coldcaller Tab */}
        <TabsContent value="coldcaller" className="mt-4">
          <Card className="p-5">
            <p className="text-sm font-semibold mb-1">Calls &gt; 30 Sekunden</p>
            <p className="text-xs text-muted-foreground mb-4">{calls.length} Calls im Zeitraum</p>
            <DataTable
              columns={[
                { key: "date", label: "Datum", bold: true },
                {
                  key: "lead",
                  label: "Lead",
                  render: (v: string, row: any) =>
                    row.closeLeadId ? (
                      <a
                        href={`https://app.close.com/lead/${row.closeLeadId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {v}
                      </a>
                    ) : v,
                },
                { key: "duration", label: "Dauer" },
                {
                  key: "googleDriveUrl",
                  label: "Recording",
                  render: (v: string, row: any) => {
                    const url = v || row.recordingUrl;
                    return url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        Anhoeren
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">–</span>
                    );
                  },
                },
              ]}
              rows={calls}
            />
          </Card>
        </TabsContent>

        {/* Setting Tab */}
        <TabsContent value="setting" className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">Ereignis:</span>
            <Select value={ergebnisFilter} onValueChange={setErgebnisFilter}>
              <SelectTrigger className="h-8 w-[220px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ERGEBNIS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {filteredSettings.length} Eintraege
            </span>
          </div>

          <Card className="p-5">
            <DataTable
              columns={[
                { key: "date", label: "Datum", bold: true },
                {
                  key: "lead",
                  label: "Lead",
                  render: (v: string, row: any) =>
                    row.closeLeadId ? (
                      <a
                        href={`https://app.close.com/lead/${row.closeLeadId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {v}
                      </a>
                    ) : v,
                },
                {
                  key: "ergebnis",
                  label: "EG Ergebnis",
                  render: (v: string) => (
                    <BadgeStatus
                      label={v}
                      type={
                        v.includes("Kunde")
                          ? "success"
                          : v.includes("Verloren") || v.includes("Unqualifiziert")
                          ? "danger"
                          : v.includes("Folgetermin")
                          ? "warning"
                          : "default"
                      }
                    />
                  ),
                },
                {
                  key: "transcriptId",
                  label: "Transcript",
                  render: (v: string) =>
                    v ? (
                      <a
                        href={`/dashboard/transcripts?id=${v}`}
                        className="text-primary hover:underline text-xs"
                      >
                        Ansehen
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">–</span>
                    ),
                },
                {
                  key: "googleDriveUrl",
                  label: "Recording",
                  render: (v: string) =>
                    v ? (
                      <a
                        href={v}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        Anhoeren
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">–</span>
                    ),
                },
              ]}
              rows={filteredSettings}
            />
          </Card>
        </TabsContent>

        {/* Closing Tab */}
        <TabsContent value="closing" className="mt-4">
          <Card className="p-5">
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-sm text-muted-foreground">Closing-Bereich wird noch aufgebaut</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
