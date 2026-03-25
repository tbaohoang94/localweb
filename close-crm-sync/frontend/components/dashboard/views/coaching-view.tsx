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
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  fetchColdcallerCalls, fetchSettingActivities,
  type SettingActivity, type TranscriptQuestion,
  type ColdcallerCall, type ColdcallObjection,
} from "@/lib/dashboard-queries";
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

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null) return <span className="text-muted-foreground text-xs">–</span>;
  const color =
    score === 0 ? "bg-red-500/15 text-red-600 border-red-200" :
    score <= 3 ? "bg-red-500/10 text-red-500 border-red-200" :
    score <= 5 ? "bg-amber-500/10 text-amber-600 border-amber-200" :
    score <= 7 ? "bg-blue-500/10 text-blue-600 border-blue-200" :
    "bg-emerald-500/10 text-emerald-600 border-emerald-200";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold border ${color}`}>
      {score}/10
    </span>
  );
}

function QualityDot({ quality }: { quality: string }) {
  const cls =
    quality === "gut" ? "bg-emerald-500" :
    quality === "mittel" ? "bg-amber-500" :
    "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} shrink-0 mt-1.5`} />;
}

const CATEGORY_LABELS: Record<string, string> = {
  pain: "Pain",
  budget: "Budget",
  authority: "Entscheider",
  timeline: "Zeitrahmen",
  needs: "Bedarf",
  rapport: "Rapport",
  closing: "Closing",
  objection_handling: "Einwandbehandlung",
  other: "Sonstige",
};

const OBJECTION_LABELS: Record<string, string> = {
  preis: "Preis",
  zeit: "Zeit",
  bedarf: "Bedarf",
  konkurrenz: "Konkurrenz",
  intern: "Intern",
  sonstige: "Sonstige",
};

const COLDCALL_RESULT_OPTIONS = [
  { value: "Alle", label: "Alle Ergebnisse" },
  { value: "Termin vereinbart", label: "Termin vereinbart" },
  { value: "Interesse", label: "Interesse" },
  { value: "Kein Interesse", label: "Kein Interesse" },
  { value: "Nicht erreicht", label: "Nicht erreicht" },
  { value: "Gatekeeper", label: "Gatekeeper" },
  { value: "Aufgelegt", label: "Aufgelegt" },
];

export default function CoachingView({ filters }: { filters: Filters }) {
  const [ergebnisFilter, setErgebnisFilter] = useState("Alle");
  const [coldcallResultFilter, setColdcallResultFilter] = useState("Alle");
  const [selectedActivity, setSelectedActivity] = useState<SettingActivity | null>(null);
  const [selectedCall, setSelectedCall] = useState<ColdcallerCall | null>(null);

  const { data: callsData, loading: l1, error: e1 } = useDashboardQuery(fetchColdcallerCalls, filters);
  const { data: settingData, loading: l2, error: e2 } = useDashboardQuery(fetchSettingActivities, filters);

  const filteredSettings = useMemo(() => {
    const list = settingData ?? [];
    if (ergebnisFilter === "Alle") return list;
    return list.filter((s) => s.ergebnis === ergebnisFilter);
  }, [settingData, ergebnisFilter]);

  const filteredCalls = useMemo(() => {
    const list = callsData ?? [];
    if (coldcallResultFilter === "Alle") return list;
    return list.filter((c) => c.callResult === coldcallResultFilter);
  }, [callsData, coldcallResultFilter]);

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

  return (
    <div className="p-6 flex flex-col gap-6">
      <Tabs defaultValue="coldcaller">
        <TabsList>
          <TabsTrigger value="coldcaller">Coldcaller</TabsTrigger>
          <TabsTrigger value="setting">Setting</TabsTrigger>
          <TabsTrigger value="closing">Closing</TabsTrigger>
        </TabsList>

        {/* Coldcaller Tab */}
        <TabsContent value="coldcaller" className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">Ergebnis:</span>
            <Select value={coldcallResultFilter} onValueChange={setColdcallResultFilter}>
              <SelectTrigger className="h-8 w-[220px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLDCALL_RESULT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {filteredCalls.length} Calls
            </span>
          </div>

          <Card className="p-5">
            <DataTable
              columns={[
                { key: "date", label: "Datum", bold: true },
                {
                  key: "lead",
                  label: "Lead",
                  render: (v: string, row: ColdcallerCall) => (
                    <button
                      onClick={() => setSelectedCall(row)}
                      className="text-left text-primary hover:underline font-medium"
                    >
                      {v}
                    </button>
                  ),
                },
                { key: "duration", label: "Dauer" },
                {
                  key: "callResult",
                  label: "Ergebnis",
                  render: (v: string | null) =>
                    v ? (
                      <BadgeStatus
                        label={v}
                        type={
                          v === "Termin vereinbart"
                            ? "success"
                            : v === "Interesse"
                            ? "warning"
                            : v === "Kein Interesse" || v === "Aufgelegt"
                            ? "danger"
                            : "default"
                        }
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">–</span>
                    ),
                },
                {
                  key: "decisionMakerReached",
                  label: "Entscheider",
                  render: (v: boolean | null) =>
                    v === null ? (
                      <span className="text-muted-foreground text-xs">–</span>
                    ) : v ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs">Ja</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-200 text-xs">Nein</Badge>
                    ),
                },
                {
                  key: "score",
                  label: "Score",
                  render: (v: number | null) => <ScoreBadge score={v} label="Call" />,
                },
                {
                  key: "googleDriveUrl",
                  label: "Recording",
                  render: (v: string, row: ColdcallerCall) => {
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
              rows={filteredCalls}
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
                  render: (v: string, row: SettingActivity) => (
                    <button
                      onClick={() => setSelectedActivity(row)}
                      className="text-left text-primary hover:underline font-medium"
                    >
                      {v}
                    </button>
                  ),
                },
                { key: "duration", label: "Dauer" },
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
                  key: "closerScoreAI",
                  label: "Closer Score",
                  render: (v: number | null) => <ScoreBadge score={v} label="Closer" />,
                },
                {
                  key: "leadScoreAI",
                  label: "Lead Score",
                  render: (v: number | null) => <ScoreBadge score={v} label="Lead" />,
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

      {/* Coldcaller Analysis Sheet */}
      <Sheet open={!!selectedCall} onOpenChange={(open) => { if (!open) setSelectedCall(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          {selectedCall && (
            <>
              <SheetHeader className="p-6 pb-2">
                <SheetTitle className="text-base">{selectedCall.lead}</SheetTitle>
                <SheetDescription>
                  {selectedCall.date} · {selectedCall.duration}{selectedCall.callResult ? ` · ${selectedCall.callResult}` : ""}
                </SheetDescription>

                <div className="flex gap-3 mt-3">
                  <div className="flex-1 rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Entscheider</span>
                      {selectedCall.decisionMakerReached === null ? (
                        <span className="text-muted-foreground text-xs">–</span>
                      ) : selectedCall.decisionMakerReached ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs">Ja</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-200 text-xs">Nein</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Call Score</span>
                      <ScoreBadge score={selectedCall.score} label="Call" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedCall.scoreReasoning || "–"}
                    </p>
                  </div>
                </div>

                {(selectedCall.googleDriveUrl || selectedCall.recordingUrl) && (
                  <a
                    href={selectedCall.googleDriveUrl || selectedCall.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    Recording anhoeren
                  </a>
                )}
              </SheetHeader>

              {selectedCall.transcript || selectedCall.aiSummary || (selectedCall.objections && selectedCall.objections.length > 0) ? (
                <Tabs defaultValue="summary" className="flex-1 flex flex-col min-h-0 px-6 pt-2">
                  <TabsList className="w-full">
                    <TabsTrigger value="summary" className="flex-1">Zusammenfassung</TabsTrigger>
                    <TabsTrigger value="objections" className="flex-1">
                      Einwaende ({selectedCall.objections?.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="transcript" className="flex-1">Transcript</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="flex-1 min-h-0">
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      <div className="prose prose-sm dark:prose-invert max-w-none py-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedCall.aiSummary || "Keine Zusammenfassung vorhanden."}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="objections" className="flex-1 min-h-0">
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      <div className="py-4 flex flex-col gap-3">
                        {(selectedCall.objections ?? []).length === 0 ? (
                          <p className="text-sm text-muted-foreground">Keine Einwaende erkannt.</p>
                        ) : (
                          (selectedCall.objections ?? []).map((obj: ColdcallObjection, i: number) => (
                            <div key={i} className="flex gap-2.5 group">
                              <QualityDot quality={obj.handling} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm leading-relaxed">{obj.einwand}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                    {OBJECTION_LABELS[obj.category] ?? obj.category}
                                  </Badge>
                                  <span className={`text-[10px] ${
                                    obj.handling === "gut" ? "text-emerald-600" :
                                    obj.handling === "mittel" ? "text-amber-600" :
                                    "text-red-500"
                                  }`}>
                                    {obj.handling}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="transcript" className="flex-1 min-h-0">
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      <div className="py-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                        {selectedCall.transcript || "Kein Transcript vorhanden."}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
                      <span className="text-muted-foreground text-xl">∅</span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Keine Analyse</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Fuer diesen Call wurde noch keine KI-Analyse erstellt.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Transcript + Scoring Sheet */}
      <Sheet open={!!selectedActivity} onOpenChange={(open) => { if (!open) setSelectedActivity(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          {selectedActivity && (
            <>
              <SheetHeader className="p-6 pb-2">
                <SheetTitle className="text-base">{selectedActivity.lead}</SheetTitle>
                <SheetDescription>
                  {selectedActivity.date} · {selectedActivity.duration} · {selectedActivity.ergebnis}
                </SheetDescription>

                {/* Score Cards */}
                <div className="flex gap-3 mt-3">
                  <div className="flex-1 rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Closer Score</span>
                      <ScoreBadge score={selectedActivity.closerScoreAI} label="Closer" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedActivity.closerScoreReasoning || "–"}
                    </p>
                  </div>
                  <div className="flex-1 rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Lead Score</span>
                      <ScoreBadge score={selectedActivity.leadScoreAI} label="Lead" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedActivity.leadScoreReasoning || "–"}
                    </p>
                  </div>
                </div>

                {selectedActivity.googleDriveUrl && (
                  <a
                    href={selectedActivity.googleDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    Recording anhoeren
                  </a>
                )}
              </SheetHeader>

              {selectedActivity.transcript || selectedActivity.aiSummary || selectedActivity.questionsAsked ? (
                <Tabs defaultValue="summary" className="flex-1 flex flex-col min-h-0 px-6 pt-2">
                  <TabsList className="w-full">
                    <TabsTrigger value="summary" className="flex-1">Zusammenfassung</TabsTrigger>
                    <TabsTrigger value="questions" className="flex-1">
                      Fragen ({selectedActivity.questionsAsked?.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="transcript" className="flex-1">Transcript</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="flex-1 min-h-0">
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      <div className="prose prose-sm dark:prose-invert max-w-none py-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedActivity.aiSummary || "Keine Zusammenfassung vorhanden."}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="questions" className="flex-1 min-h-0">
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      <div className="py-4 flex flex-col gap-3">
                        {(selectedActivity.questionsAsked ?? []).length === 0 ? (
                          <p className="text-sm text-muted-foreground">Keine Fragen extrahiert.</p>
                        ) : (
                          (selectedActivity.questionsAsked ?? []).map((q: TranscriptQuestion, i: number) => (
                            <div key={i} className="flex gap-2.5 group">
                              <QualityDot quality={q.quality} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm leading-relaxed">{q.question}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                    {CATEGORY_LABELS[q.category] ?? q.category}
                                  </Badge>
                                  <span className={`text-[10px] ${
                                    q.quality === "gut" ? "text-emerald-600" :
                                    q.quality === "mittel" ? "text-amber-600" :
                                    "text-red-500"
                                  }`}>
                                    {q.quality}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="transcript" className="flex-1 min-h-0">
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      <div className="py-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                        {selectedActivity.transcript || "Kein Transcript vorhanden."}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
                      <span className="text-muted-foreground text-xl">∅</span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Kein Transcript</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Fuer dieses Gespraech wurde kein Transcript erfasst.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
