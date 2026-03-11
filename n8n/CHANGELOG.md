# Changelog

## 2025-09-11 -- Initial Setup
- Created project structure
- Exported all workflows and credentials from n8n instance
- Set up Docker infrastructure with PostgreSQL, Cloudflare Tunnel
- Active workflows: Get Custom Activities, Get Opportunities, Demodesk Transcriptions, GET Settingsgespraeche, Add new Users

## 2025-01-31 -- Error Logger
- Added Error Logger workflow for centralized error tracking to Airtable

## 2026-02-02 -- Reorganization
- Migrated to new `documents/n8n/` folder structure
- Separated knowledge, context, and workflow files
- Added Airtable schema as JSON
- Documented architecture decisions

## 2026-02-27 -- 23-eg-stattgefunden Ueberarbeitung
- **Test-Trigger:** Webhook Trigger mit lead_id oder activity_id Input fuer manuelles Testen
- **Dedup:** Prueft bestehende Transkripte in Supabase vor Verarbeitung (calls.id UUID → transcripts.source_id)
- **25 MB Check:** HEAD Request vor Download, uebergrosse Recordings werden uebersprungen + geloggt
- **Lead/Owner Mapping:** Loest Close IDs auf Supabase UUIDs auf (close_lead_id → leads.id, close_user_id → users.id)
- **2-Step-Download:** Close Recording-URLs geben 302 → S3; HEAD mit disableFollowRedirect → Location → GET ohne Auth
- **Schema-Mapping:** Korrektes Supabase-Schema: source_type='call', source_id=calls.id (UUID), content (statt transcript)
- **Save Transcripts:** Plain INSERT (kein on_conflict, da kein unique constraint auf source_type+source_id)
- **GPT-Prompt:** Sales-spezifisches Format (Zusammenfassung, Kundenbedarf, Einwaende, Naechste Schritte, Ergebnis)
- **Ergebnis-Kontext:** EG-Ergebnis (1-5) wird dem GPT-Prompt und der Close-Notiz mitgegeben
- **Error-Handling:** skippedCalls Array statt stilles Verschlucken, Details in sync_runs geloggt
- **Reihenfolge:** AI Summary → Save Transcripts (ai_summary direkt mit gespeichert)
- **Test Mode:** Ueberspringt Opportunity-Erstellung und Wait bei Test-Ausfuehrung
- **Lokal getestet:** End-to-End auf lokaler n8n-Instanz (Port 5679) verifiziert

## 2026-02-27 -- 23-eg-stattgefunden: Google Drive Upload + lead_id
- **Google Drive Upload:** Recordings werden nach Whisper-Transkription in Google Drive gespeichert (gleicher Ordner wie WF 10 Demodesk)
- **Binary Output:** Transcribe Calls gibt pro Call ein Item mit Binary-Audio aus (property `data`, audio/mpeg)
- **Aggregate Results:** Neuer Node sammelt Items zurueck, kombiniert Transcript-Daten mit Google Drive Response (file_id, webViewLink)
- **lead_id:** Transkripte werden jetzt dem Lead zugeordnet (lead_id FK → leads.id)
- **Supabase Migration 005:** `lead_id UUID REFERENCES leads(id)` in transcripts-Tabelle hinzugefuegt (existierte in 001_initial.sql, fehlte aber in DB)
- **Robustes Aggregate:** Referenziert Originaldaten aus Transcribe Calls per Index, Google Drive Fehler (z.B. fehlende Credential) werden toleriert
- **Google Drive Credential:** Nutzt "Google Drive account 2" (ID: d105sfwUnmIqZW8b) — nur auf Hetzner verfuegbar, lokal laeuft Workflow trotzdem durch (onError: continueRegularOutput)
- **Lokal getestet:** End-to-End erfolgreich — Whisper, AI Summary, lead_id in Supabase, Close Note, Google Drive Binary korrekt (Credential-Fehler erwartet)
