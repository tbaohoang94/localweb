/**
 * Testdaten-Seed fuer die Google Maps Lead Pipeline.
 *
 * Ausfuehrung:
 *   npx tsx scripts/seed-test-data.ts --size small
 *   npx tsx scripts/seed-test-data.ts --size medium --edge-cases
 *
 * Voraussetzungen:
 *   - STAGING_SUPABASE_URL und STAGING_SUPABASE_KEY als Env-Variablen
 *   - NIEMALS gegen Production ausfuehren!
 *
 * Optionen:
 *   --size small|medium|large    Datenmenge (default: small)
 *   --edge-cases                 Sonderzeichen und Grenzwerte einbauen
 *   --clean                      Bestehende Testdaten loeschen vor Seed
 */

// --- Konfiguration ---

interface SeedConfig {
  size: "small" | "medium" | "large";
  includeEdgeCases: boolean;
  clean: boolean;
  targetEnv: "staging";
}

const SUPABASE_URL = process.env.STAGING_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.STAGING_SUPABASE_KEY ?? "";

const SIZE_MAP = {
  small: { cities: 5, locationsPerCity: 3, businessesPerLocation: 7 },
  medium: { cities: 15, locationsPerCity: 10, businessesPerLocation: 35 },
  large: { cities: 25, locationsPerCity: 20, businessesPerLocation: 100 },
} as const;

// --- Edge Cases ---

const EDGE_CASE_NAMES = [
  "Müller & Söhne GmbH",
  "日本語テスト",
  "🚀 Startup Inc.",
  "O'Brien's Pub & Grill",
  "Señor Tacos | México",
  'Quote "Test" Company',
  "Backslash\\Test\\Firma",
  "Neue\nZeile\tTab",
  "",
  "   ", // nur Whitespace
];

const EDGE_CASE_WEBSITES = [
  "https://example.com",
  "http://müller-und-söhne.de",
  "https://xn--mller-kva.de", // Punycode
  null,
  "",
  "not-a-url",
  "https://" + "x".repeat(500) + ".com", // extrem lang
];

const EDGE_CASE_PHONES = [
  "+49 851 12345",
  "0851/12345",
  "(0851) 12 34 5",
  "+81-3-1234-5678",
  null,
  "",
  "abc-not-a-phone",
  "+" + "1".repeat(30), // extrem lang
];

const EDGE_CASE_EMAILS = [
  "test@example.com",
  "müller@example.de",
  null,
  "",
  "not-an-email",
  "a".repeat(200) + "@example.com",
  "<script>alert('xss')</script>@test.com",
];

const XSS_STRINGS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  "'; DROP TABLE businesses; --",
  "<b>Bold</b> & <i>Italic</i>",
];

// --- Hilfsfunktionen ---

async function supabaseInsert(
  table: string,
  rows: Record<string, unknown>[],
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal,resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${await res.text()}` };
  return { ok: true };
}

async function supabaseDelete(table: string, filter: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// --- Datengeneratoren ---

const GERMAN_CITIES = [
  "Passau",
  "München",
  "Berlin",
  "Hamburg",
  "Köln",
  "Frankfurt",
  "Stuttgart",
  "Düsseldorf",
  "Leipzig",
  "Dresden",
  "Nürnberg",
  "Hannover",
  "Bremen",
  "Augsburg",
  "Regensburg",
  "Freiburg",
  "Würzburg",
  "Ulm",
  "Kiel",
  "Rostock",
  "Mainz",
  "Bonn",
  "Aachen",
  "Heidelberg",
  "Darmstadt",
];

const SEARCH_QUERIES = [
  "Geigenbauer",
  "Zahnarzt",
  "Steuerberater",
  "Rechtsanwalt",
  "Fotograf",
  "Elektriker",
  "Maler",
  "Physiotherapeut",
  "Friseur",
  "Bäckerei",
  "Restaurant",
  "Klempner",
  "Tischler",
  "Optiker",
  "Dachdecker",
  "Malermeister",
  "Schlüsseldienst",
  "Reinigung",
  "Hundeschule",
  "Fahrschule",
];

const LOCATION_STAGES = ["new", "scraping", "scraped", "imported", "failed_scrape"] as const;
const BUSINESS_STAGES = [
  "new",
  "qualified",
  "unqualified",
  "enriching",
  "enriched",
  "failed_enrich",
  "exported",
] as const;

function generateLocations(
  config: SeedConfig,
): {
  country: string;
  city: string;
  query: string;
  pipeline_stage: string;
}[] {
  const locations: ReturnType<typeof generateLocations> = [];
  const cities = GERMAN_CITIES.slice(0, SIZE_MAP[config.size].cities);

  for (const city of cities) {
    const queries = [...SEARCH_QUERIES]
      .sort(() => Math.random() - 0.5)
      .slice(0, SIZE_MAP[config.size].locationsPerCity);

    for (const query of queries) {
      locations.push({
        country: "Deutschland",
        city,
        query,
        pipeline_stage: randomFrom(LOCATION_STAGES),
      });
    }
  }

  return locations;
}

function generateBusinesses(
  locations: { city: string; query: string }[],
  config: SeedConfig,
): Record<string, unknown>[] {
  const businesses: Record<string, unknown>[] = [];
  const count = SIZE_MAP[config.size].businessesPerLocation;

  for (const loc of locations) {
    for (let i = 0; i < count; i++) {
      const stage = randomFrom(BUSINESS_STAGES);
      const isEdgeCase = config.includeEdgeCases && i < EDGE_CASE_NAMES.length;

      const biz: Record<string, unknown> = {
        place_id: `test_${uuid()}`,
        name: isEdgeCase ? EDGE_CASE_NAMES[i] || `Test Business ${i}` : `${loc.query} ${loc.city} #${i + 1}`,
        category: loc.query,
        city: loc.city,
        country: "Deutschland",
        address: `Teststraße ${i + 1}, ${loc.city}`,
        phone: isEdgeCase ? randomFrom(EDGE_CASE_PHONES) : `+49 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        website: isEdgeCase ? randomFrom(EDGE_CASE_WEBSITES) : `https://www.test-${uuid().substring(0, 8)}.de`,
        rating: Math.round((Math.random() * 4 + 1) * 10) / 10,
        reviews_count: Math.floor(Math.random() * 500),
        pipeline_stage: stage,
        search_string: loc.query,
        rank: i + 1,
        im_email: isEdgeCase ? randomFrom(EDGE_CASE_EMAILS) : `info@test-${uuid().substring(0, 8)}.de`,
        im_contact_name: isEdgeCase ? randomFrom(EDGE_CASE_NAMES) : `Max Mustermann ${i}`,
      };

      // XSS-Strings in Edge Cases
      if (config.includeEdgeCases && i === 0) {
        biz.name = randomFrom(XSS_STRINGS);
        biz.website_summary = randomFrom(XSS_STRINGS);
      }

      // Stage-spezifische Felder
      if (["enriched", "exported"].includes(stage)) {
        biz.enriched_at = new Date().toISOString();
        biz.website_summary = `Test-Zusammenfassung fuer ${biz.name}`;
      }
      if (["qualified", "enriched", "exported"].includes(stage)) {
        biz.qualified_at = new Date().toISOString();
        biz.qualification_reason = "Test-Qualifizierung";
      }
      if (stage === "failed_enrich") {
        biz.last_error = "Test-Fehler: Enrichment fehlgeschlagen";
        biz.retry_count = Math.floor(Math.random() * 3) + 1;
      }

      businesses.push(biz);
    }
  }

  return businesses;
}

// --- Hauptlogik ---

async function main() {
  const args = process.argv.slice(2);
  const config: SeedConfig = {
    size: "small",
    includeEdgeCases: args.includes("--edge-cases"),
    clean: args.includes("--clean"),
    targetEnv: "staging",
  };

  const sizeArg = args.indexOf("--size");
  if (sizeArg !== -1 && args[sizeArg + 1]) {
    const s = args[sizeArg + 1] as SeedConfig["size"];
    if (["small", "medium", "large"].includes(s)) config.size = s;
  }

  // Sicherheitschecks
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("FEHLER: STAGING_SUPABASE_URL und STAGING_SUPABASE_KEY muessen gesetzt sein");
    process.exit(1);
  }

  // Production-Schutz
  if (SUPABASE_URL.includes("wknzyrvcrcdchnysntii")) {
    console.error("ABBRUCH: Production-Projekt erkannt! Seed nur gegen Staging!");
    process.exit(1);
  }

  console.log("=== Testdaten-Seed ===");
  console.log(`  Groesse: ${config.size}`);
  console.log(`  Edge Cases: ${config.includeEdgeCases ? "Ja" : "Nein"}`);
  console.log(`  Clean: ${config.clean ? "Ja" : "Nein"}`);
  console.log("");

  // Cleanup
  if (config.clean) {
    console.log("Loesche bestehende Testdaten...");
    await supabaseDelete("businesses", "place_id=like.test_%25");
    await supabaseDelete("locations", "country=eq.Deutschland");
    console.log("  Bereinigt.\n");
  }

  // Locations generieren
  const locations = generateLocations(config);
  console.log(`Generiere ${locations.length} Locations...`);

  // In Batches einfuegen
  const LOC_BATCH = 50;
  for (let i = 0; i < locations.length; i += LOC_BATCH) {
    const batch = locations.slice(i, i + LOC_BATCH);
    const result = await supabaseInsert("locations", batch);
    if (!result.ok) {
      console.error(`  Fehler bei Locations-Batch ${i}: ${result.error}`);
    }
  }
  console.log(`  ${locations.length} Locations eingefuegt.\n`);

  // Businesses generieren
  const businesses = generateBusinesses(locations, config);
  console.log(`Generiere ${businesses.length} Businesses...`);

  const BIZ_BATCH = 200;
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < businesses.length; i += BIZ_BATCH) {
    const batch = businesses.slice(i, i + BIZ_BATCH);
    const result = await supabaseInsert("businesses", batch);
    if (result.ok) {
      inserted += batch.length;
    } else {
      console.error(`  Fehler bei Business-Batch ${i}: ${result.error}`);
      errors += batch.length;
    }
    // Fortschritt
    if ((i + BIZ_BATCH) % 1000 === 0 || i + BIZ_BATCH >= businesses.length) {
      process.stdout.write(`  ${Math.min(i + BIZ_BATCH, businesses.length)}/${businesses.length}\r`);
    }
  }

  console.log(`\n  ${inserted} Businesses eingefuegt, ${errors} Fehler.\n`);

  // Zusammenfassung
  const counts = SIZE_MAP[config.size];
  console.log("=== Zusammenfassung ===");
  console.log(`  Cities: ${counts.cities}`);
  console.log(`  Locations: ${locations.length}`);
  console.log(`  Businesses: ${businesses.length}`);
  console.log(`  Edge Cases: ${config.includeEdgeCases ? "enthalten" : "nicht enthalten"}`);
  console.log("");
  console.log("Seed abgeschlossen!");
}

main().catch((e) => {
  console.error("Unerwarteter Fehler:", e);
  process.exit(1);
});
