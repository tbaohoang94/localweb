/* ─── DB ROW TYPES ─── */

export interface DbUser {
  id: string;
  close_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "caller" | "setter" | "closer" | "admin";
  status: "active" | "inactive";
}

export interface DbLead {
  id: string;
  close_lead_id: string;
  lead_name: string;
  branche: string | null;
  city: string | null;
  source: string | null;
  status: string | null;
}

export interface DbOpportunity {
  id: string;
  close_opportunity_id: string;
  lead_id: string;
  user_id: string | null;
  setter_id: string | null;
  status: string;
  product: string | null;
  value: number | null;
  setup_fee: number | null;
  monthly_value: number | null;
  contract_duration: number | null;
  confidence: number | null;
  lost_reason: string | null;
  forecast_close_date: string | null;
  closed_at: string | null;
  close_created_at: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  synced_at: string | null;
  // Joined
  leads?: { lead_name: string; branche: string | null; close_lead_id?: string } | null;
  users?: { first_name: string; last_name: string } | null;
}

export interface DbCall {
  id: string;
  close_call_id: string;
  user_id: string;
  lead_id: string;
  direction: string;
  disposition: string | null;
  duration: number | null;
  phone_number: string | null;
  note: string | null;
  close_created_at: string | null;
  created_at: string;
  // Joined
  leads?: { lead_name: string } | null;
  users?: { first_name: string; last_name: string } | null;
}

export interface DbMeeting {
  id: string;
  close_meeting_id: string;
  user_id: string;
  lead_id: string;
  title: string | null;
  duration: number | null;
  starts_at: string | null;
  ends_at: string | null;
  note: string | null;
  close_created_at: string | null;
  created_at: string;
  // Joined
  leads?: { lead_name: string } | null;
  users?: { first_name: string; last_name: string } | null;
}

export interface DbCustomActivityType {
  id: string;
  close_type_id: string;
  name: string;
}

export interface DbCustomActivity {
  id: string;
  close_activity_id: string;
  type_id: string;
  user_id: string;
  lead_id: string;
  note: string | null;
  custom_fields: Record<string, unknown> | null;
  close_created_at: string | null;
  created_at: string;
  // Joined
  custom_activity_types?: { name: string } | null;
  users?: { first_name: string; last_name: string } | null;
  leads?: { lead_name: string } | null;
}

export interface DbCommissionRule {
  id: string;
  role: string;
  event_type: string;
  calc_type: "fixed" | "formula";
  fixed_amount: number | null;
  formula: string | null;
}

/* ─── COMPUTED DASHBOARD TYPES ─── */

export interface DashboardFilters {
  from: string;
  to: string;
  rep: string;
}

export interface CloserKPI {
  userId: string;
  name: string;
  eg: number;
  sg: number;
  egNoShow: number;
  sgNoShow: number;
  egShowRate: number;    // eg / (eg + egNoShow) × 100
  sgShowRate: number;    // sg / (sg + sgNoShow) × 100
  won: number;
  lost: number;
  winRate: number;
  winRateSG: number;   // Won / Alle Opps mit SG stattgefunden × 100
  wonWithSG: number;   // Anzahl Won-Deals deren Lead ein SG hatte
  oppsWithSG: number;  // Anzahl aller Opps deren Lead ein SG hatte
  umsatz: number;
  avgDeal: number;
  cycle: number;
  pipeline: number;
  offeneOpps: number;
  provMTD: number;
  projectedUmsatz: number;
}

export interface ColdcallerKPI {
  userId: string;
  closeUserId: string;
  name: string;
  talkTime: number;
  bruttoCalls: number;
  nettoCalls: number;
  terminGelegt: number;
  terminGelegtET: number;
  terminGelegtFT: number;
  terminQuote: number;
  noShow: number;
  showUpRate: number;            // egStattgefunden / terminGelegt × 100
  erreichbarkeitsQuote: number;  // nettoCalls / bruttoCalls × 100
  egStattgefunden: number;
  neukunden: number;
  provision: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  color: string;
}

export interface DashboardOpportunity {
  id: string;
  closeLeadId: string;
  name: string;
  rep: string;
  stage: string;
  value: number;
  prob: number;
  lastActivityDays: number;
  stageAge: number;
  risk: "high" | "medium" | "low";
  lostReason: string | null;
}

export interface WonDeal {
  name: string;
  closeLeadId: string;
  rep: string;
  value: number;
  setupFee: number;
  monthlyValue: number;
  contractDuration: number;
  industry: string;
  cycle: number;
  date: string;
}

export interface RevenueMonth {
  m: string;
  actual: number;
  target: number;
  forecast: number;
}

export interface WeeklyHistoryEntry {
  week: string;
  calls: number;
  meetings: number;
}

export interface ProvisionTransaction {
  date: string;
  type: string;
  ref: string;
  closeLeadId: string;
  amount: number;
  oppValue?: number;
  setupFee?: number;
  monthlyValue?: number;
  contractDuration?: number;
  source?: string;
  contractUrl?: string;
  empfehlungBonus?: number;
}

export interface EgToSgRateResult {
  total: number;
  converted: number;
  sgStattgefunden: number;
  rate: number;
  perUser: {
    userId: string;
    name: string;
    total: number;
    converted: number;
    sgStattgefunden: number;
    rate: number;
  }[];
}

export interface MeetingTrendEntry {
  date: string;
  count: number;
}

export interface CloserProvisionSummary {
  userId: string;
  name: string;
  wonDeals: number;
  setupFeeTotal: number;
  yearlyRevenue: number;
  empfehlungTotal: number;
  provisionTotal: number;
}

export interface SyncLogEntry {
  id: string;
  entity: string;
  status: string;
  recordsSynced: number | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSec: number | null;
}

export interface CustomActivityRow {
  id: string;
  closeLeadId: string;
  leadName: string;
  activityType: string;
  updatedAt: string;
  createdBy: string;
  userId: string;
  typeId: string;
}

export interface CustomActivityKPIs {
  egVereinbart: number;
  egNoShow: number;
  egStattgefunden: number;
  sgStattgefunden: number;
  sgNoShow: number;
  kundeGewonnen: number;
}

export interface CloserPipelineRow {
  userId: string;
  name: string;
  egStattgefunden: number;
  sgStattgefunden: number;
  angebotVerschickt: number;
  won: number;
  lost: number;
  pipelineValue: number;
}
