/**
 * Shared Supabase Utilities.
 */

import { createClient } from "@/lib/supabase-browser";
import type { Database } from "@/lib/types/database.types";

type TableName = keyof Database["public"]["Tables"];

/**
 * Batch-Insert mit automatischem Fallback auf Einzelinserts bei Konflikten.
 * Gibt { ok, failed } zurueck.
 */
export async function batchInsert<T extends TableName>(
  table: T,
  rows: Database["public"]["Tables"][T]["Insert"][],
  batchSize = 50,
): Promise<{ ok: number; failed: number }> {
  const supabase = createClient();
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase generics erfordern any fuer dynamische Tabellennamen
    const { error } = await (supabase.from(table) as any).insert(batch);

    if (error) {
      // Batch fehlgeschlagen (wahrscheinlich Duplikate) — einzeln versuchen
      for (const row of batch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: rowErr } = await (supabase.from(table) as any).insert(row);
        if (rowErr) failed++;
        else ok++;
      }
    } else {
      ok += batch.length;
    }
  }

  return { ok, failed };
}
