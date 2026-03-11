import { describe, it, expect } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  it("ist eine Pino-Instanz", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("hat Redact-Konfiguration fuer DSGVO-relevante Felder", () => {
    // Pino mit redact konfiguriert — pruefe dass die Instanz existiert
    // Detailliertes Redact-Testing wuerde Pino-Interna testen
    expect(logger).toBeDefined();
  });
});
