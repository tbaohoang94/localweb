"use client";

import { useState } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase-browser";
import { batchInsert } from "@/lib/supabase-helpers";

type CsvRow = Record<string, string>;

export default function CsvImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [keywordCol, setKeywordCol] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ ok: number; failed: number } | null>(null);
  const supabase = createClient();

  function autoDetect(hdrs: string[]) {
    const lower = hdrs.map((h) => h.toLowerCase().trim());
    const match =
      hdrs[
        lower.findIndex((h) => h.includes("keyword") || h.includes("query") || h.includes("search"))
      ] || "";
    setKeywordCol(match);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const hdrs = results.meta.fields || [];
        setHeaders(hdrs);
        setRows(results.data);
        autoDetect(hdrs);
      },
    });
  }

  async function handleImport() {
    if (!keywordCol) return;
    setImporting(true);

    // Eindeutige Keywords extrahieren
    const keywords = [
      ...new Set(rows.map((r) => r[keywordCol]?.trim()).filter((kw): kw is string => Boolean(kw))),
    ];

    // Alle Staedte laden
    const { data: cities, error: citiesErr } = await supabase
      .from("cities")
      .select("city, country");

    if (citiesErr || !cities || cities.length === 0) {
      setResult({ ok: 0, failed: keywords.length });
      setImporting(false);
      return;
    }

    let totalOk = 0;
    let totalFailed = 0;

    for (const keyword of keywords) {
      setProgress(
        `Verarbeite Keyword ${keywords.indexOf(keyword) + 1}/${keywords.length}: ${keyword}`,
      );

      const locationRows = cities
        .filter((c): c is { city: string; country: string } => Boolean(c.city && c.country))
        .map((c) => ({
          country: c.country,
          city: c.city,
          query: keyword,
        }));

      const { ok, failed } = await batchInsert("locations", locationRows);
      totalOk += ok;
      totalFailed += failed;
    }

    setProgress("");
    setResult({ ok: totalOk, failed: totalFailed });
    setImporting(false);
    onImported();
  }

  const keywords = keywordCol
    ? [...new Set(rows.map((r) => r[keywordCol]?.trim()).filter(Boolean))]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Keywords aus CSV importieren</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        {rows.length === 0 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Waehle eine CSV-Datei mit Keywords. Jedes Keyword wird mit allen Staedten kombiniert.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        ) : result ? (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-medium text-green-700">{result.ok}</span> Locations erstellt
              {result.failed > 0 && (
                <>
                  , <span className="font-medium text-red-600">{result.failed}</span> uebersprungen
                  (Duplikate)
                </>
              )}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
            >
              Schliessen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {rows.length} Zeilen gefunden. Waehle die Keyword-Spalte:
            </p>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Keyword-Spalte</label>
              <select
                value={keywordCol}
                onChange={(e) => setKeywordCol(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">-- Auswaehlen --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {keywords.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {keywords.length} eindeutige Keywords gefunden:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.slice(0, 20).map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700"
                    >
                      {kw}
                    </span>
                  ))}
                  {keywords.length > 20 && (
                    <span className="text-xs text-muted-foreground">
                      +{keywords.length - 20} weitere
                    </span>
                  )}
                </div>
              </div>
            )}

            {progress && <p className="text-xs text-blue-600">{progress}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleImport}
                disabled={!keywordCol || importing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {importing
                  ? "Importiere..."
                  : `${keywords.length} Keywords × alle Staedte importieren`}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
