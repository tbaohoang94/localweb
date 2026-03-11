/**
 * Close.io Custom Activity Type IDs (as stored in Close).
 * Map to Supabase UUIDs via `custom_activity_types.close_type_id`.
 */
export const CLOSE_ACTIVITY_TYPES = {
  /** EG - stattgefunden */
  ERSTGESPRAECH: "actitype_0Pow7dFbqAOrFjLsCT068D",
  /** SG - stattgefunden */
  STRATEGIEGESPRAECH: "actitype_1t4dAEI4JjnbDr6mRnECr0",
  /** EG vereinbart (ET = Ersttermin) */
  EG_VEREINBART_ET: "actitype_6GTMexlVYwCl3ER9rYB4x4",
  /** EG vereinbart (FT = Folgetermin) */
  EG_VEREINBART_FT: "actitype_4jcmhCre676aqKjDVWqODu",
  /** EG - NoShow / Absage (von Kunde) */
  EG_NOSHOW: "actitype_5lGDZdgbNYgL7ii0Bbjno9",
  /** SG - NoShow / Absage (von Kunde) */
  SG_NOSHOW: "actitype_0kl5mkpGgPgDhbQEYKyJvD",
  /** SG - Angebot erstellen */
  SG_ANGEBOT: "actitype_4SrDqCdE7yZuxZrw3YxoLI",
  /** Kunde gewonnen */
  KUNDE_GEWONNEN: "actitype_3dEZCczRxJQieHfSCDW3bg",
  /** Kunde verloren */
  KUNDE_VERLOREN: "actitype_6dqeewSGR6SAXD6ZH9xbM3",
} as const;

/**
 * Close.io Custom Field IDs for activity custom fields.
 * JSONB key in `custom_activities.custom_fields` uses `custom.` prefix,
 * e.g. `custom.cf_Bp0LGE1a2Am7...`
 */
export const CLOSE_ACTIVITY_FIELDS = {
  /** Ergebnis on "EG - stattgefunden" activities */
  EG_ERGEBNIS: "cf_Bp0LGE1a2Am7BlHszQNtV7KuTpVYDthbiKOetsFkcUQ",
  /** Ergebnis on "SG - stattgefunden" activities */
  SG_ERGEBNIS: "cf_HCpCPtrExVmNACqjhFkjZ9fMHQimVgodE22DYt50ycf",
  /** Ergebnis on "EG - NoShow" activities */
  EG_NOSHOW_ERGEBNIS: "cf_P5mZqkFdSf5MpxQe9yajrvaUlQQ9rWvMGa1igfab7Dn",
  /** Ergebnis on "SG - NoShow" activities */
  SG_NOSHOW_ERGEBNIS: "cf_1jQaceRH6hI9L0W635q7xDopqEbAbPyIy2RkOLPfk8o",
} as const;

/**
 * Close.io Custom Field IDs stored in activity custom_fields for coldcaller attribution.
 * Value in JSONB is the coldcaller's Close User ID (e.g. `user_xxx`).
 * Match against `users.close_user_id`.
 */
export const CLOSE_CALLER_FIELDS = {
  /** "EG vereinbart von" field on ET activities (Ersttermin) */
  EG_VEREINBART_VON_ET: "cf_MRw4PtKrl0I4H3CzuhLuXf4AZA9EjDuJSqAJKCpggwW",
  /** "EG vereinbart von" field on FT activities (Folgetermin) */
  EG_VEREINBART_VON_FT: "cf_NFxzYKxJwmiKsb98aMgCpTsjZRtvFaGppepIINl7ivO",
  /** Coldcaller field on NoShow activities */
  EG_VEREINBART_VON_NOSHOW: "cf_4Kf8YlJlnWddQbbKmycK4Ypym89VmLUI3xXgdPnljyg",
  /** Coldcaller field on EG stattgefunden activities */
  EG_VEREINBART_VON_EG: "cf_oEh1QgX7ImOHxWyc1lUDE2Li4pbmQDuvuogpODBDiLO",
} as const;

/**
 * Close.io Custom Field IDs on Opportunity custom_fields.
 * JSONB key uses `custom.` prefix, e.g. `custom.cf_HzGEkxy4H...`
 */
export const CLOSE_OPPORTUNITY_FIELDS = {
  /** Einrichtungsgebühr / Setup Fee */
  SETUP_FEE: "cf_HzGEkxy4HPF03ZyoIREA1nqdwkcU88ZVuYzukW3Vxz5",
  /** Monatliche Gebühr / Monthly Value */
  MONTHLY_VALUE: "cf_cgWJXeUknNLKNBL4ym7GMVEzXYEcmIV5xnITqWVIL59",
  /** Laufzeit in Monaten / Contract Duration */
  CONTRACT_DURATION: "cf_iansZUWRLsuekI5ZbgZL6EjoqrAMwItKxYz2GRgoQCL",
  /** Source / Quelle (z.B. "2 - Empfehlung") */
  SOURCE: "cf_eHu2dgKDfAp35khVtlfDBGoNTvZaxiVYSoXvlrMtFDJ",
  /** Vertragsurl (docuseal.eu Link) */
  CONTRACT_URL: "cf_aMWs0R4RzPkj7VU9qAdLdXR2BKcuHfFPNCu0LaMfhwC",
} as const;

/** JSONB key helper: prepends `custom.` prefix for Supabase queries */
export function jsonbKey(fieldId: string): string {
  return `custom.${fieldId}`;
}

/**
 * Known values for the EG Ergebnis field.
 * Choices: "1 - Kunde", "2 - Folgetermin", "3 - Follow-up", "4 - Verloren", "5 - Unqualifiziert"
 */
export const EG_ERGEBNIS_VALUES = {
  KUNDE: "1 - Kunde",
  FOLGETERMIN: "2 - Folgetermin",
  FOLLOW_UP: "3 - Follow-up",
  VERLOREN: "4 - Verloren",
  UNQUALIFIZIERT: "5 - Unqualifiziert",
} as const;
