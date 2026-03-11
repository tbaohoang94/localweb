"use client";

import { useOpsData } from "@/lib/hooks/use-ops-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "@/lib/format";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  error: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function OpsPage() {
  const { systemLogs, pipelineErrors, dlqItems, loading, error, refetch } = useOpsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Lade Operations-Daten...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Fehler: {error}</p>
      </div>
    );
  }

  const criticalCount = systemLogs.filter((l) => l.severity === "critical").length;
  const errorCount = systemLogs.filter((l) => l.severity === "error").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Operations</h1>
          <p className="text-muted-foreground text-sm">System-Health und Error-Monitoring</p>
        </div>
        <button
          onClick={refetch}
          className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
        >
          Aktualisieren
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="System Logs" value={systemLogs.length} subtitle="Letzte 50 Eintraege" />
        <KpiCard
          title="Critical/Errors"
          value={criticalCount + errorCount}
          subtitle={`${criticalCount} critical, ${errorCount} errors`}
          highlight={criticalCount + errorCount > 0}
        />
        <KpiCard
          title="Pipeline-Fehler"
          value={pipelineErrors.length}
          subtitle="Stuck oder failed"
          highlight={pipelineErrors.length > 0}
        />
        <KpiCard
          title="Dead Letter Queue"
          value={dlqItems.length}
          subtitle="Ausstehende Items"
          highlight={dlqItems.length > 0}
        />
      </div>

      {/* Pipeline Errors */}
      {pipelineErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline-Fehler ({pipelineErrors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Typ</th>
                    <th className="text-left py-2 px-3 font-medium">Name</th>
                    <th className="text-left py-2 px-3 font-medium">Stage</th>
                    <th className="text-left py-2 px-3 font-medium">Retries</th>
                    <th className="text-left py-2 px-3 font-medium">Fehler</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineErrors.map((err) => (
                    <tr key={err.id} className="border-b border-border/50">
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">
                          {err.entity_type}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 truncate max-w-[200px]">{err.name || "—"}</td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary" className="text-xs">
                          {err.stage}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">{err.retry_count}</td>
                      <td className="py-2 px-3 text-muted-foreground truncate max-w-[300px]">
                        {err.last_error || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Logs (letzte 50)</CardTitle>
        </CardHeader>
        <CardContent>
          {systemLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keine Log-Eintraege vorhanden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Zeitpunkt</th>
                    <th className="text-left py-2 px-3 font-medium">Quelle</th>
                    <th className="text-left py-2 px-3 font-medium">Severity</th>
                    <th className="text-left py-2 px-3 font-medium">Workflow</th>
                    <th className="text-left py-2 px-3 font-medium">Nachricht</th>
                  </tr>
                </thead>
                <tbody>
                  {systemLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(log.created_at)}
                      </td>
                      <td className="py-2 px-3">{log.source}</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${SEVERITY_COLORS[log.severity] || ""}`}
                        >
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 truncate max-w-[200px]">
                        {log.workflow_name || "—"}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground truncate max-w-[300px]">
                        {log.error_message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DLQ */}
      {dlqItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Dead Letter Queue ({dlqItems.length} ausstehend)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Workflow</th>
                    <th className="text-left py-2 px-3 font-medium">Fehler</th>
                    <th className="text-left py-2 px-3 font-medium">Retries</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">Erstellt</th>
                  </tr>
                </thead>
                <tbody>
                  {dlqItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2 px-3">{item.source_workflow}</td>
                      <td className="py-2 px-3 text-muted-foreground truncate max-w-[300px]">
                        {item.error_message || "—"}
                      </td>
                      <td className="py-2 px-3">
                        {item.retry_count}/{item.max_retries}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary" className="text-xs">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {formatDistanceToNow(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  highlight = false,
}: {
  title: string;
  value: number;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-red-500/30" : ""}>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${highlight ? "text-red-400" : ""}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
