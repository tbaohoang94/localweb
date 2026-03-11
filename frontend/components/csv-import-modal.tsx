"use client";

import { useState } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase-browser";

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
        lower.findIndex(
          (h) => h.includes("keyword") || h.includes("query") || h.includes("search")
        )
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

    // Extract unique keywords
    const keywords = [
      ...new Set(
        rows.map((r) => r[keywordCol]?.trim()).filter(Boolean)
      ),
    ];

    // Fetch all cities
    const { data: cities, error: citiesErr } = await supabase
      .from("cities")
      .select("city, country");

    if (citiesErr || !cities || cities.length === 0) {
      setResult({ ok: 0, failed: keywords.length });
      setImporting(false);
      return;
    }

    let ok = 0;
    let failed = 0;

    for (let ki = 0; ki < keywords.length; ki++) {
      const keyword = keywords[ki];
      setProgress(`Processing keyword ${ki + 1}/${keywords.length}: ${keyword}`);

      const locationRows = cities.map((c) => ({
        country: c.country,
        city: c.city,
        query: keyword,
      }));

      for (let i = 0; i < locationRows.length; i += 50) {
        const batch = locationRows.slice(i, i + 50);
        const { error } = await supabase.from("locations").insert(batch);
        if (error) {
          for (const row of batch) {
            const { error: rowErr } = await supabase.from("locations").insert(row);
            if (rowErr) failed++;
            else ok++;
          }
        } else {
          ok += batch.length;
        }
      }
    }

    setProgress("");
    setResult({ ok, failed });
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
          <h2 className="text-lg font-semibold">Import Keywords from CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        {rows.length === 0 ? (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Select a CSV file with keywords. Each keyword will be combined with all cities.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        ) : result ? (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-medium text-green-700">{result.ok}</span> locations created
              {result.failed > 0 && (
                <>
                  , <span className="font-medium text-red-600">{result.failed}</span> skipped
                  (duplicates)
                </>
              )}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {rows.length} rows found. Select the keyword column:
            </p>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Keyword column</label>
              <select
                value={keywordCol}
                onChange={(e) => setKeywordCol(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">-- Select --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {keywords.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {keywords.length} unique keywords found:
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
                    <span className="text-xs text-gray-400">
                      +{keywords.length - 20} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {progress && (
              <p className="text-xs text-blue-600">{progress}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleImport}
                disabled={!keywordCol || importing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {importing
                  ? "Importing..."
                  : `Import ${keywords.length} keywords × all cities`}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
