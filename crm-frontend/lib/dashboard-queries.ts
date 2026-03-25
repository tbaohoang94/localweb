import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DbUser, DbOpportunity, DbCall, DbMeeting, DbCustomActivity,
  DbCommissionRule, DashboardFilters, CloserKPI, ColdcallerKPI,
  PipelineStage, DashboardOpportunity, WonDeal, RevenueMonth,
  WeeklyHistoryEntry, ProvisionTransaction, EgToSgRateResult, MeetingTrendEntry,
} from "@/lib/types/dashboard";
import {
  CLOSE_ACTIVITY_TYPES, CLOSE_ACTIVITY_FIELDS, CLOSE_CALLER_FIELDS, CLOSE_OPPORTUNITY_FIELDS, jsonbKey, EG_ERGEBNIS_VALUES,
} from "@/lib/close-field-mappings";
import { mapStatus, isActiveStage, PIPELINE_ORDER, STAGE_COLORS } from "@/lib/status-mapping";
import { userName, daysSince, daysBetween, formatDateShort, isoWeekLabel, monthLabel } from "@/lib/formatters";

/* ─── HELPERS ─── */

/** Parse a JSONB value that may be number or numeric string */
function numOrStr(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") { const n = parseFloat(val); return isNaN(n) ? 0 : n; }
  return 0;
}

/** Extract setup_fee / monthly_value / contract_duration from dedicated columns OR opportunity custom_fields JSONB */
function oppFinancials(opp: { setup_fee?: number | null; monthly_value?: number | null; contract_duration?: number | null; custom_fields?: Record<string, unknown> | null }) {
  const cf = opp.custom_fields;
  const sfKey = jsonbKey(CLOSE_OPPORTUNITY_FIELDS.SETUP_FEE);
  const mvKey = jsonbKey(CLOSE_OPPORTUNITY_FIELDS.MONTHLY_VALUE);
  const durKey = jsonbKey(CLOSE_OPPORTUNITY_FIELDS.CONTRACT_DURATION);
  return {
    setupFee: opp.setup_fee ?? (cf?.[sfKey] != null ? numOrStr(cf[sfKey]) : 0),
    monthlyValue: opp.monthly_value ?? (cf?.[mvKey] != null ? numOrStr(cf[mvKey]) : 0),
    contractDuration: opp.contract_duration ?? (cf?.[durKey] != null ? numOrStr(cf[durKey]) : 0),
  };
}

/* ─── USERS ─── */

export async function fetchActiveUsers(supabase: SupabaseClient): Promise<DbUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("status", "active")
    .order("role")
    .order("first_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchAllClosers(supabase: SupabaseClient): Promise<DbUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "closer")
    .order("first_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/* ─── COMMISSION RULES ─── */

export async function fetchCommissionRules(supabase: SupabaseClient): Promise<DbCommissionRule[]> {
  const { data, error } = await supabase.from("commission_rules").select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/* ─── OPPORTUNITIES (raw, with joins) ─── */

async function fetchOpportunitiesRaw(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<DbOpportunity[]> {
  let query = supabase
    .from("opportunities")
    .select("*, leads(lead_name, branche, close_lead_id), users:user_id(first_name, last_name)")
    .order("close_created_at", { ascending: false });

  query = query.or(
    `close_created_at.gte.${filters.from},closed_at.gte.${filters.from}`
  );

  if (filters.rep !== "Alle") {
    query = query.eq("user_id", filters.rep);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/* ─── PIPELINE STAGES ─── */

export async function fetchPipelineStages(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<PipelineStage[]> {
  const opps = await fetchOpportunitiesRaw(supabase, filters);

  const stageMap = new Map<string, { count: number; value: number }>();
  for (const opp of opps) {
    const stage = mapStatus(opp.status);
    const prev = stageMap.get(stage) ?? { count: 0, value: 0 };
    stageMap.set(stage, {
      count: prev.count + 1,
      value: prev.value + (opp.value ?? 0),
    });
  }

  return PIPELINE_ORDER.map((stage) => ({
    stage,
    count: stageMap.get(stage)?.count ?? 0,
    value: stageMap.get(stage)?.value ?? 0,
    color: STAGE_COLORS[stage] ?? STAGE_COLORS.Other,
  }));
}

/* ─── AVG SALES CYCLE ─── */

export async function fetchAvgSalesCycle(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<number> {
  let query = supabase
    .from("opportunities")
    .select("close_created_at, closed_at")
    .ilike("status", "%Won%")
    .not("close_created_at", "is", null)
    .not("closed_at", "is", null)
    .gte("closed_at", filters.from)
    .lte("closed_at", filters.to + "T23:59:59");
  if (filters.rep !== "Alle") query = query.eq("user_id", filters.rep);
  const { data } = await query;
  if (!data || data.length === 0) return 0;
  const total = data.reduce((s, o) => s + daysBetween(o.close_created_at!, o.closed_at!), 0);
  return Math.round(total / data.length);
}

/* ─── DASHBOARD OPPORTUNITIES (critical only) ─── */

export async function fetchDashboardOpportunities(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<DashboardOpportunity[]> {
  // Fetch active-stage opportunities
  let query = supabase
    .from("opportunities")
    .select("*, leads(lead_name, close_lead_id), users:user_id(first_name, last_name)")
    .not("status", "ilike", "%Won%")
    .not("status", "ilike", "%Lost%")
    .order("close_created_at", { ascending: true });

  if (filters.rep !== "Alle") {
    query = query.eq("user_id", filters.rep);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const opps = data ?? [];
  const now = new Date();
  const cutoff14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch lead IDs to check for recent call activity
  const leadIds = Array.from(new Set(opps.map((o) => o.lead_id)));
  let recentCallLeadIds = new Set<string>();
  if (leadIds.length > 0) {
    const { data: recentCalls } = await supabase
      .from("calls")
      .select("lead_id")
      .in("lead_id", leadIds)
      .gte("close_created_at", cutoff14);
    for (const c of recentCalls ?? []) {
      recentCallLeadIds.add(c.lead_id);
    }
  }

  const nowIso = now.toISOString();
  const results: DashboardOpportunity[] = [];

  for (const opp of opps) {
    const stage = mapStatus(opp.status);
    const stageAge = opp.close_created_at ? daysBetween(opp.close_created_at, nowIso) : 0;
    const lastSync = opp.synced_at ?? opp.created_at;
    const lastActivityDays = daysSince(lastSync);

    // Critical = older than 30 days OR no call in last 14 days
    const isCritical = stageAge > 30 || !recentCallLeadIds.has(opp.lead_id);
    if (!isCritical) continue;

    let risk: "high" | "medium" | "low" = "low";
    if (isActiveStage(stage)) {
      if (lastActivityDays > 14 || stageAge > 60) risk = "high";
      else if (lastActivityDays > 7 || stageAge > 30) risk = "medium";
    }

    results.push({
      id: opp.id,
      closeLeadId: (opp as any).leads?.close_lead_id ?? "",
      name: (opp as any).leads?.lead_name ?? "Unbekannt",
      rep: opp.users ? userName(opp.users.first_name, opp.users.last_name) : "–",
      stage,
      value: opp.value ?? 0,
      prob: opp.confidence ?? 0,
      lastActivityDays,
      stageAge,
      risk,
      lostReason: opp.lost_reason,
    });
  }

  return results;
}

/* ─── CLOSER KPIs ─── */

export async function fetchCloserKPIs(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<CloserKPI[]> {
  // Fetch: active users + all opportunities + commission rules + NoShow type IDs
  const [users, opps, rules, activityTypesRes] = await Promise.all([
    fetchActiveUsers(supabase),
    fetchOpportunitiesRaw(supabase, filters),
    fetchCommissionRules(supabase),
    supabase
      .from("custom_activity_types")
      .select("id, close_type_id")
      .in("close_type_id", [
        CLOSE_ACTIVITY_TYPES.ERSTGESPRAECH,
        CLOSE_ACTIVITY_TYPES.STRATEGIEGESPRAECH,
        CLOSE_ACTIVITY_TYPES.EG_NOSHOW,
        CLOSE_ACTIVITY_TYPES.SG_NOSHOW,
      ]),
  ]);

  const closers = users.filter((u) => u.role === "closer" &&
    (filters.rep === "Alle" || u.id === filters.rep));

  // Also fetch won deals from ALL closers (including inactive) for total KPI
  const allWonRes = await supabase
    .from("opportunities")
    .select("value, user_id")
    .ilike("status", "%Won%")
    .gte("closed_at", filters.from)
    .lte("closed_at", filters.to + "T23:59:59");

  const closerRule = rules.find(
    (r) => r.role === "closer" && r.event_type === "deal_closed"
  );

  // Activity type IDs
  const typeRows = activityTypesRes.data ?? [];
  const egTypeId = typeRows.find((r) => r.close_type_id === CLOSE_ACTIVITY_TYPES.ERSTGESPRAECH)?.id;
  const sgTypeId = typeRows.find((r) => r.close_type_id === CLOSE_ACTIVITY_TYPES.STRATEGIEGESPRAECH)?.id;
  const egNoShowTypeId = typeRows.find((r) => r.close_type_id === CLOSE_ACTIVITY_TYPES.EG_NOSHOW)?.id;
  const sgNoShowTypeId = typeRows.find((r) => r.close_type_id === CLOSE_ACTIVITY_TYPES.SG_NOSHOW)?.id;
  const toDate = filters.to + "T23:59:59";
  const closerIds = closers.map((c) => c.id);

  async function buildActivityCountMap(typeId: string | undefined): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!typeId || closerIds.length === 0) return map;
    let q = supabase
      .from("custom_activities")
      .select("user_id")
      .eq("type_id", typeId)
      .gte("close_created_at", filters.from)
      .lte("close_created_at", toDate);
    if (filters.rep !== "Alle") q = q.eq("user_id", filters.rep);
    const { data } = await q;
    for (const row of data ?? []) {
      map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
    }
    return map;
  }

  const [egActivityMap, sgActivityMap, egNoShowMap, sgNoShowMap] = await Promise.all([
    buildActivityCountMap(egTypeId),
    buildActivityCountMap(sgTypeId),
    buildActivityCountMap(egNoShowTypeId),
    buildActivityCountMap(sgNoShowTypeId),
  ]);

  return closers.map((closer) => {
    const myOpps = opps.filter((o) => o.user_id === closer.id);
    const myWon = myOpps.filter((o) => mapStatus(o.status) === "Won");
    const myLost = myOpps.filter((o) => mapStatus(o.status) === "Lost");
    const myActive = myOpps.filter((o) => isActiveStage(mapStatus(o.status)));
    const umsatz = myWon.reduce((s, o) => s + (o.value ?? 0), 0);
    const won = myWon.length;
    const lost = myLost.length;
    const total = won + lost;
    const winRate = total > 0 ? (won / total) * 100 : 0;
    const avgDeal = won > 0 ? umsatz / won : 0;

    const cycles = myWon
      .filter((o) => o.close_created_at && o.closed_at)
      .map((o) => daysBetween(o.close_created_at!, o.closed_at!));
    const cycle = cycles.length > 0
      ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
      : 0;

    const pipeline = myActive.reduce((s, o) => s + (o.value ?? 0), 0);

    // Provision: 0.5 × setup_fee + (contract_duration / 6) × monthly_value + 200€ if Empfehlung
    const srcKey = jsonbKey(CLOSE_OPPORTUNITY_FIELDS.SOURCE);
    let provMTD = 0;
    if (closerRule) {
      for (const deal of myWon) {
        const fin = oppFinancials(deal);
        const src = ((deal.custom_fields as Record<string, unknown> | null)?.[srcKey] as string) ?? "";
        const empfBonus = src.toLowerCase().includes("empfehlung") ? 200 : 0;
        provMTD += 0.5 * fin.setupFee + (fin.contractDuration / 6) * fin.monthlyValue + empfBonus;
      }
    }

    const projectedUmsatz = umsatz + myActive.reduce(
      (s, o) => s + (o.value ?? 0) * ((o.confidence ?? 50) / 100),
      0
    );

    const eg = egActivityMap.get(closer.id) ?? 0;
    const sg = sgActivityMap.get(closer.id) ?? 0;
    const egNoShow = egNoShowMap.get(closer.id) ?? 0;
    const sgNoShow = sgNoShowMap.get(closer.id) ?? 0;
    const egShowRate = (eg + egNoShow) > 0 ? (eg / (eg + egNoShow)) * 100 : 0;
    const sgShowRate = (sg + sgNoShow) > 0 ? (sg / (sg + sgNoShow)) * 100 : 0;

    return {
      userId: closer.id,
      name: userName(closer.first_name, closer.last_name),
      eg,
      sg,
      egNoShow,
      sgNoShow,
      egShowRate,
      sgShowRate,
      won,
      lost,
      winRate,
      umsatz,
      avgDeal,
      cycle,
      pipeline,
      offeneOpps: myActive.length,
      provMTD,
      projectedUmsatz,
    };
  });
}

/* ─── COLDCALLER KPIs ─── */

export async function fetchColdcallerKPIs(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<ColdcallerKPI[]> {
  const [users, activityTypesRes] = await Promise.all([
    fetchActiveUsers(supabase),
    supabase
      .from("custom_activity_types")
      .select("id, close_type_id")
      .in("close_type_id", [
        CLOSE_ACTIVITY_TYPES.EG_VEREINBART_ET,
        CLOSE_ACTIVITY_TYPES.EG_VEREINBART_FT,
        CLOSE_ACTIVITY_TYPES.EG_NOSHOW,
        CLOSE_ACTIVITY_TYPES.ERSTGESPRAECH,
      ]),
  ]);

  if (activityTypesRes.error) throw new Error(activityTypesRes.error.message);

  const callers = users.filter(
    (u) => u.role === "caller" && (filters.rep === "Alle" || u.id === filters.rep)
  );
  if (callers.length === 0) return [];

  const callerIds = callers.map((c) => c.id);

  const typeMap = new Map<string, string>();
  for (const t of activityTypesRes.data ?? []) typeMap.set(t.close_type_id, t.id);

  const nullId = "00000000-0000-0000-0000-000000000000";
  const etTypeId = typeMap.get(CLOSE_ACTIVITY_TYPES.EG_VEREINBART_ET) ?? nullId;
  const ftTypeId = typeMap.get(CLOSE_ACTIVITY_TYPES.EG_VEREINBART_FT) ?? nullId;
  const noShowTypeId = typeMap.get(CLOSE_ACTIVITY_TYPES.EG_NOSHOW) ?? nullId;
  const egTypeId = typeMap.get(CLOSE_ACTIVITY_TYPES.ERSTGESPRAECH) ?? nullId;

  const toDate = filters.to + "T23:59:59";

  // Build supabaseId → closeUserId map (for FT activities that use user_id as coldcaller)
  const supaToCloseMap = new Map<string, string>();
  for (const c of callers) supaToCloseMap.set(c.id, c.close_user_id);

  const [callStatsRes, etRes, ftRes, noShowRes, egRes, neukundenRes] = await Promise.all([
    supabase.rpc("get_caller_call_stats", {
      p_caller_ids: callerIds,
      p_from: filters.from,
      p_to: toDate,
    }),
    supabase
      .from("custom_activities")
      .select("custom_fields")
      .eq("type_id", etTypeId)
      .gte("close_created_at", filters.from)
      .lte("close_created_at", toDate),
    supabase
      .from("custom_activities")
      .select("user_id")
      .eq("type_id", ftTypeId)
      .gte("close_created_at", filters.from)
      .lte("close_created_at", toDate),
    supabase
      .from("custom_activities")
      .select("custom_fields")
      .eq("type_id", noShowTypeId)
      .gte("close_created_at", filters.from)
      .lte("close_created_at", toDate),
    supabase
      .from("custom_activities")
      .select("custom_fields")
      .eq("type_id", egTypeId)
      .gte("close_created_at", filters.from)
      .lte("close_created_at", toDate),
    supabase
      .from("opportunities")
      .select("lead_id")
      .ilike("status", "%Won%")
      .gte("closed_at", filters.from)
      .lte("closed_at", toDate),
  ]);

  if (callStatsRes.error) throw new Error(callStatsRes.error.message);
  if (etRes.error) throw new Error(etRes.error.message);
  if (ftRes.error) throw new Error(ftRes.error.message);
  if (noShowRes.error) throw new Error(noShowRes.error.message);
  if (egRes.error) throw new Error(egRes.error.message);
  if (neukundenRes.error) throw new Error(neukundenRes.error.message);

  // Neukunden: find which coldcaller created the EG vereinbart on leads with Won opps
  const wonLeadIds = Array.from(new Set(
    (neukundenRes.data ?? []).map((o: any) => o.lead_id).filter(Boolean) as string[]
  ));

  type CallerCounts = { terminGelegtET: number; terminGelegtFT: number; noShow: number; egStattgefunden: number };
  const emptyCount = (): CallerCounts => ({ terminGelegtET: 0, terminGelegtFT: 0, noShow: 0, egStattgefunden: 0 });
  const countMap = new Map<string, CallerCounts>();

  const etKey = `custom.${CLOSE_CALLER_FIELDS.EG_VEREINBART_VON_ET}`;
  const noShowKey = `custom.${CLOSE_CALLER_FIELDS.EG_VEREINBART_VON_NOSHOW}`;
  const egKey = `custom.${CLOSE_CALLER_FIELDS.EG_VEREINBART_VON_EG}`;

  // ET: coldcaller from custom_fields
  for (const row of etRes.data ?? []) {
    const id = (row.custom_fields as any)?.[etKey] as string | undefined;
    if (!id) continue;
    const prev = countMap.get(id) ?? emptyCount();
    prev.terminGelegtET++;
    countMap.set(id, prev);
  }
  // FT: coldcaller = activity creator (user_id), convert to close_user_id
  for (const row of ftRes.data ?? []) {
    const closeId = supaToCloseMap.get(row.user_id);
    if (!closeId) continue;
    const prev = countMap.get(closeId) ?? emptyCount();
    prev.terminGelegtFT++;
    countMap.set(closeId, prev);
  }
  // NoShow: coldcaller from custom_fields
  for (const row of noShowRes.data ?? []) {
    const id = (row.custom_fields as any)?.[noShowKey] as string | undefined;
    if (!id) continue;
    const prev = countMap.get(id) ?? emptyCount();
    prev.noShow++;
    countMap.set(id, prev);
  }
  // EG stattgefunden: coldcaller from custom_fields
  for (const row of egRes.data ?? []) {
    const id = (row.custom_fields as any)?.[egKey] as string | undefined;
    if (!id) continue;
    const prev = countMap.get(id) ?? emptyCount();
    prev.egStattgefunden++;
    countMap.set(id, prev);
  }

  // For each won lead, find who created the EG vereinbart (ET/FT) activity
  const neukundenByCloseUserId = new Map<string, Set<string>>();
  if (wonLeadIds.length > 0) {
    const { data: egVonActivities } = await supabase
      .from("custom_activities")
      .select("lead_id, user_id, custom_fields, type_id")
      .in("type_id", [etTypeId, ftTypeId])
      .in("lead_id", wonLeadIds);
    for (const row of egVonActivities ?? []) {
      // ET: use custom_fields; FT: use user_id (activity creator)
      let callerId: string | undefined;
      if (row.type_id === ftTypeId) {
        callerId = supaToCloseMap.get(row.user_id);
      } else {
        callerId = (row.custom_fields as any)?.[etKey] as string | undefined;
      }
      if (!callerId || !row.lead_id) continue;
      if (!neukundenByCloseUserId.has(callerId)) neukundenByCloseUserId.set(callerId, new Set());
      neukundenByCloseUserId.get(callerId)!.add(row.lead_id);
    }
  }

  const callStatsMap = new Map<string, { brutto_calls: number; netto_calls: number; talk_time_min: number }>();
  for (const row of (callStatsRes.data ?? []) as any[]) {
    callStatsMap.set(row.user_id, row);
  }

  // Nettocalls: count calls > 30s per caller (use count query to avoid 1000-row server limit)
  const nettoMap = new Map<string, number>();
  await Promise.all(callerIds.map(async (id) => {
    const { count } = await supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id)
      .gte("close_created_at", filters.from)
      .lte("close_created_at", toDate)
      .gt("duration", 30);
    nettoMap.set(id, count ?? 0);
  }));

  return callers.map((caller) => {
    const cs = callStatsMap.get(caller.id);
    const bruttoCalls = cs?.brutto_calls ?? 0;
    const nettoCalls = nettoMap.get(caller.id) ?? 0;
    const talkTime = cs?.talk_time_min ?? 0;

    const acts = countMap.get(caller.close_user_id) ?? emptyCount();
    const terminGelegtET = acts.terminGelegtET;
    const terminGelegtFT = acts.terminGelegtFT;
    const terminGelegt = terminGelegtET + terminGelegtFT;
    const terminQuote = nettoCalls > 0 ? (terminGelegt / nettoCalls) * 100 : 0;
    const noShow = acts.noShow;
    const egStattgefunden = acts.egStattgefunden;
    const showUpRate = (egStattgefunden + noShow) > 0 ? (egStattgefunden / (egStattgefunden + noShow)) * 100 : 0;
    const erreichbarkeitsQuote = bruttoCalls > 0 ? (nettoCalls / bruttoCalls) * 100 : 0;
    const neukunden = neukundenByCloseUserId.get(caller.close_user_id)?.size ?? 0;
    const provision = egStattgefunden * 60 - noShow * 10 + neukunden * 200;

    return {
      userId: caller.id,
      closeUserId: caller.close_user_id,
      name: userName(caller.first_name, caller.last_name),
      talkTime,
      bruttoCalls,
      nettoCalls,
      terminGelegt,
      terminGelegtET,
      terminGelegtFT,
      terminQuote,
      noShow,
      showUpRate,
      erreichbarkeitsQuote,
      egStattgefunden,
      neukunden,
      provision,
    };
  });
}

/* ─── MEETING TREND ─── */

export async function fetchMeetingTrend(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<MeetingTrendEntry[]> {
  const [etTypesRes, ftTypesRes] = await Promise.all([
    supabase.from("custom_activity_types").select("id").eq("close_type_id", CLOSE_ACTIVITY_TYPES.EG_VEREINBART_ET).single(),
    supabase.from("custom_activity_types").select("id").eq("close_type_id", CLOSE_ACTIVITY_TYPES.EG_VEREINBART_FT).single(),
  ]);

  const toDate = filters.to + "T23:59:59";
  const typeIds: string[] = [];
  if (etTypesRes.data) typeIds.push(etTypesRes.data.id);
  if (ftTypesRes.data) typeIds.push(ftTypesRes.data.id);
  if (typeIds.length === 0) return [];

  const { data, error } = await supabase
    .from("custom_activities")
    .select("close_created_at")
    .in("type_id", typeIds)
    .gte("close_created_at", filters.from)
    .lte("close_created_at", toDate);

  if (error) throw new Error(error.message);

  const dayMap = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.close_created_at) continue;
    const day = row.close_created_at.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }

  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ─── WON DEALS ─── */

export async function fetchWonDeals(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<WonDeal[]> {
  let query = supabase
    .from("opportunities")
    .select("*, leads(lead_name, branche, close_lead_id), users:user_id(first_name, last_name)")
    .ilike("status", "%Won%")
    .gte("closed_at", filters.from)
    .lte("closed_at", filters.to + "T23:59:59")
    .order("closed_at", { ascending: false });

  if (filters.rep !== "Alle") {
    query = query.eq("user_id", filters.rep);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((opp) => {
    const fin = oppFinancials(opp);
    return {
      name: (opp as any).leads?.lead_name ?? "Unbekannt",
      closeLeadId: (opp as any).leads?.close_lead_id ?? "",
      rep: opp.users ? userName(opp.users.first_name, opp.users.last_name) : "–",
      value: opp.value ?? 0,
      setupFee: fin.setupFee,
      monthlyValue: fin.monthlyValue,
      contractDuration: fin.contractDuration,
      industry: (opp as any).leads?.branche ?? "Unbekannt",
      cycle: opp.close_created_at && opp.closed_at
        ? daysBetween(opp.close_created_at, opp.closed_at)
        : 0,
      date: opp.closed_at ? formatDateShort(opp.closed_at) : "–",
    };
  });
}

/* ─── REVENUE BY MONTH ─── */

export async function fetchRevenueByMonth(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<RevenueMonth[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const { data, error } = await supabase
    .from("opportunities")
    .select("value, closed_at, confidence")
    .ilike("status", "%Won%")
    .gte("closed_at", sixMonthsAgo.toISOString().split("T")[0])
    .order("closed_at");

  if (error) throw new Error(error.message);

  const monthMap = new Map<string, number>();
  for (const opp of data ?? []) {
    if (!opp.closed_at) continue;
    const label = monthLabel(opp.closed_at);
    monthMap.set(label, (monthMap.get(label) ?? 0) + (opp.value ?? 0));
  }

  const months: RevenueMonth[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("de-DE", { month: "short" });
    months.push({ m: label, actual: monthMap.get(label) ?? 0, target: 0, forecast: 0 });
  }

  return months;
}

/* ─── INDUSTRY BREAKDOWN ─── */

export async function fetchIndustryBreakdown(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<{ industry: string; value: number }[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("value, leads(branche)")
    .ilike("status", "%Won%")
    .gte("closed_at", filters.from)
    .lte("closed_at", filters.to + "T23:59:59");

  if (error) throw new Error(error.message);

  const map = new Map<string, number>();
  for (const opp of data ?? []) {
    const industry = (opp as any).leads?.branche ?? "Unbekannt";
    map.set(industry, (map.get(industry) ?? 0) + (opp.value ?? 0));
  }

  return Array.from(map.entries())
    .map(([industry, value]) => ({ industry, value }))
    .sort((a, b) => b.value - a.value);
}

/* ─── WEEKLY HISTORY ─── */

export async function fetchWeeklyHistory(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<WeeklyHistoryEntry[]> {
  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
  const since = sixWeeksAgo.toISOString().split("T")[0];

  const [callsRes, meetingsRes] = await Promise.all([
    supabase.from("calls").select("close_created_at").gte("close_created_at", since).order("close_created_at"),
    supabase.from("meetings").select("close_created_at").gte("close_created_at", since).order("close_created_at"),
  ]);

  if (callsRes.error) throw new Error(callsRes.error.message);
  if (meetingsRes.error) throw new Error(meetingsRes.error.message);

  const weekMap = new Map<string, { calls: number; meetings: number }>();

  for (const c of callsRes.data ?? []) {
    if (!c.close_created_at) continue;
    const w = isoWeekLabel(c.close_created_at);
    const prev = weekMap.get(w) ?? { calls: 0, meetings: 0 };
    weekMap.set(w, { ...prev, calls: prev.calls + 1 });
  }

  for (const m of meetingsRes.data ?? []) {
    if (!m.close_created_at) continue;
    const w = isoWeekLabel(m.close_created_at);
    const prev = weekMap.get(w) ?? { calls: 0, meetings: 0 };
    weekMap.set(w, { ...prev, meetings: prev.meetings + 1 });
  }

  return Array.from(weekMap.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => parseInt(a.week.replace("KW ", "")) - parseInt(b.week.replace("KW ", "")))
    .slice(-6);
}

/* ─── COACHING CALLS ─── */

export interface CoachingCall {
  id: string;
  leadId: string;
  date: string;
  lead: string;
  duration: string;
  durationSec: number;
  outcome: string;
  closerScoring: string;
  leadScoring: string;
  transcript: string | null;
  aiSummary: string | null;
}

export async function fetchCoachingCalls(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<CoachingCall[]> {
  // Fetch calls
  let callQuery = supabase
    .from("calls")
    .select("id, user_id, lead_id, duration, disposition, close_created_at, note, close_call_id, leads(lead_name)")
    .gte("close_created_at", filters.from)
    .lte("close_created_at", filters.to + "T23:59:59")
    .order("close_created_at", { ascending: false })
    .limit(20);

  if (filters.rep !== "Alle") {
    callQuery = callQuery.eq("user_id", filters.rep);
  }

  const { data: callData, error: callError } = await callQuery;
  if (callError) throw new Error(callError.message);
  const calls = callData ?? [];
  if (calls.length === 0) return [];

  // Collect lead IDs for transcript + activity lookup
  const leadIds = Array.from(new Set(calls.map((c) => c.lead_id).filter(Boolean)));

  // Fetch transcripts for these leads
  const { data: transcriptData } = await supabase
    .from("transcripts")
    .select("lead_id, content, ai_summary, close_call_id")
    .in("lead_id", leadIds)
    .order("created_at", { ascending: false });

  // Build transcript map (close_call_id -> transcript, fallback to lead_id)
  const transcriptByCallId = new Map<string, { content: string; ai_summary: string | null }>();
  const transcriptByLeadId = new Map<string, { content: string; ai_summary: string | null }>();
  for (const t of transcriptData ?? []) {
    if (t.close_call_id && !transcriptByCallId.has(t.close_call_id)) {
      transcriptByCallId.set(t.close_call_id, { content: t.content, ai_summary: t.ai_summary });
    }
    if (t.lead_id && !transcriptByLeadId.has(t.lead_id)) {
      transcriptByLeadId.set(t.lead_id, { content: t.content, ai_summary: t.ai_summary });
    }
  }

  // Fetch EG stattgefunden activities for scoring fields
  const egTypeId = "9f26a4e5-489a-42ce-a5dd-54a92bb02081"; // EG - stattgefunden UUID
  const { data: activityData } = await supabase
    .from("custom_activities")
    .select("lead_id, custom_fields")
    .eq("type_id", egTypeId)
    .in("lead_id", leadIds);

  // Build scoring map (lead_id -> scoring)
  const scoringByLead = new Map<string, { closerScoring: string; leadScoring: string }>();
  const lsKey = jsonbKey(CLOSE_ACTIVITY_FIELDS.LEAD_SCORING);
  const csKey = jsonbKey(CLOSE_ACTIVITY_FIELDS.CLOSER_SCORING);
  for (const a of activityData ?? []) {
    if (a.lead_id && !scoringByLead.has(a.lead_id)) {
      const cf = (a.custom_fields ?? {}) as Record<string, string>;
      scoringByLead.set(a.lead_id, {
        closerScoring: cf[csKey] ?? "–",
        leadScoring: cf[lsKey] ?? "–",
      });
    }
  }

  return calls.map((call) => {
    const t =
      (call as any).close_call_id ? transcriptByCallId.get((call as any).close_call_id) : undefined;
    const tFallback = t ?? transcriptByLeadId.get(call.lead_id);
    const scoring = scoringByLead.get(call.lead_id);
    return {
      id: call.id,
      leadId: call.lead_id,
      date: call.close_created_at ? formatDateShort(call.close_created_at) : "–",
      lead: (call as any).leads?.lead_name ?? "Unbekannt",
      duration: `${Math.round((call.duration ?? 0) / 60)} Min`,
      durationSec: call.duration ?? 0,
      outcome: call.disposition ?? "–",
      closerScoring: scoring?.closerScoring ?? "–",
      leadScoring: scoring?.leadScoring ?? "–",
      transcript: tFallback?.content ?? null,
      aiSummary: tFallback?.ai_summary ?? null,
    };
  });
}

/* ─── MONTHLY PROVISION (Closer) ─── */

export async function fetchMonthlyProvision(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<{ m: string; prov: number }[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  let query = supabase
    .from("opportunities")
    .select("value, monthly_value, setup_fee, contract_duration, custom_fields, closed_at")
    .ilike("status", "%Won%")
    .gte("closed_at", sixMonthsAgo.toISOString().split("T")[0])
    .order("closed_at");

  if (filters.rep !== "Alle") {
    query = query.eq("user_id", filters.rep);
  }

  const [wonRes, rules] = await Promise.all([query, fetchCommissionRules(supabase)]);
  if (wonRes.error) throw new Error(wonRes.error.message);

  const closerRule = rules.find((r) => r.role === "closer" && r.event_type === "deal_closed");

  const srcKey = jsonbKey(CLOSE_OPPORTUNITY_FIELDS.SOURCE);
  const monthMap = new Map<string, number>();
  for (const deal of wonRes.data ?? []) {
    if (!deal.closed_at) continue;
    const label = monthLabel(deal.closed_at);
    const fin = oppFinancials(deal);
    const src = ((deal.custom_fields as Record<string, unknown> | null)?.[srcKey] as string) ?? "";
    const empfBonus = src.toLowerCase().includes("empfehlung") ? 200 : 0;
    const prov = closerRule ? 0.5 * fin.setupFee + (fin.contractDuration / 6) * fin.monthlyValue + empfBonus : deal.value ?? 0;
    monthMap.set(label, (monthMap.get(label) ?? 0) + Math.round(prov));
  }

  const months: { m: string; prov: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("de-DE", { month: "short" });
    months.push({ m: label, prov: monthMap.get(label) ?? 0 });
  }

  return months;
}

/* ─── EG → SG CONVERSION RATE ─── */

export async function fetchEgToSgRate(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<EgToSgRateResult> {
  const [egTypeRes, sgTypeRes] = await Promise.all([
    supabase.from("custom_activity_types").select("id").eq("close_type_id", CLOSE_ACTIVITY_TYPES.ERSTGESPRAECH).single(),
    supabase.from("custom_activity_types").select("id").eq("close_type_id", CLOSE_ACTIVITY_TYPES.STRATEGIEGESPRAECH).single(),
  ]);

  if (egTypeRes.error || !egTypeRes.data) {
    return { total: 0, converted: 0, sgStattgefunden: 0, rate: 0, perUser: [] };
  }

  const toDate = filters.to + "T23:59:59";

  let egQuery = supabase
    .from("custom_activities")
    .select("user_id, custom_fields, users:user_id(first_name, last_name)")
    .eq("type_id", egTypeRes.data.id)
    .gte("close_created_at", filters.from)
    .lte("close_created_at", toDate);

  let sgQuery = supabase
    .from("custom_activities")
    .select("user_id")
    .gte("close_created_at", filters.from)
    .lte("close_created_at", toDate);

  if (sgTypeRes.data) {
    sgQuery = sgQuery.eq("type_id", sgTypeRes.data.id);
  } else {
    sgQuery = sgQuery.eq("type_id", "00000000-0000-0000-0000-000000000000");
  }

  if (filters.rep !== "Alle") {
    egQuery = egQuery.eq("user_id", filters.rep);
    sgQuery = sgQuery.eq("user_id", filters.rep);
  }

  const [egRes, sgRes] = await Promise.all([egQuery, sgQuery]);
  if (egRes.error) throw new Error(egRes.error.message);

  const rows = egRes.data ?? [];
  const sgRows = sgRes.data ?? [];
  const ergebnisKey = jsonbKey(CLOSE_ACTIVITY_FIELDS.EG_ERGEBNIS);

  const userMap = new Map<string, { name: string; total: number; converted: number; sgStattgefunden: number }>();

  for (const row of rows) {
    const ergebnis = (row.custom_fields as Record<string, unknown>)?.[ergebnisKey] as string | undefined;
    const isSgVereinbart = ergebnis === EG_ERGEBNIS_VALUES.FOLGETERMIN;
    const uid = row.user_id;
    const prev = userMap.get(uid) ?? {
      name: row.users ? userName((row.users as any).first_name, (row.users as any).last_name) : "–",
      total: 0, converted: 0, sgStattgefunden: 0,
    };
    prev.total++;
    if (isSgVereinbart) prev.converted++;
    userMap.set(uid, prev);
  }

  for (const row of sgRows) {
    const uid = row.user_id;
    const prev = userMap.get(uid) ?? { name: "–", total: 0, converted: 0, sgStattgefunden: 0 };
    prev.sgStattgefunden++;
    userMap.set(uid, prev);
  }

  const total = rows.length;
  const converted = Array.from(userMap.values()).reduce((s, u) => s + u.converted, 0);
  const sgStattgefunden = sgRows.length;

  const perUser = Array.from(userMap.entries()).map(([userId, d]) => ({
    userId,
    name: d.name,
    total: d.total,
    converted: d.converted,
    sgStattgefunden: d.sgStattgefunden,
    rate: d.total > 0 ? (d.converted / d.total) * 100 : 0,
  }));

  return {
    total,
    converted,
    sgStattgefunden,
    rate: total > 0 ? (converted / total) * 100 : 0,
    perUser,
  };
}

/* ─── PROVISION TRANSACTIONS (Closer) ─── */

export async function fetchCloserProvisionTransactions(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<ProvisionTransaction[]> {
  let wonQuery = supabase
    .from("opportunities")
    .select("value, monthly_value, setup_fee, contract_duration, custom_fields, closed_at, users:user_id(first_name, last_name), leads(lead_name, close_lead_id)")
    .ilike("status", "%Won%")
    .gte("closed_at", filters.from)
    .lte("closed_at", filters.to + "T23:59:59")
    .order("closed_at", { ascending: false });

  if (filters.rep !== "Alle") {
    wonQuery = wonQuery.eq("user_id", filters.rep);
  }

  const [rules, wonRes] = await Promise.all([
    fetchCommissionRules(supabase),
    wonQuery,
  ]);

  if (wonRes.error) throw new Error(wonRes.error.message);

  const closerRule = rules.find((r) => r.role === "closer" && r.event_type === "deal_closed");

  const srcKey = jsonbKey(CLOSE_OPPORTUNITY_FIELDS.SOURCE);
  const urlKey = jsonbKey(CLOSE_OPPORTUNITY_FIELDS.CONTRACT_URL);

  return (wonRes.data ?? []).map((deal) => {
    const fin = oppFinancials(deal);
    const cf = deal.custom_fields as Record<string, unknown> | null;
    const source = (cf?.[srcKey] as string) ?? "";
    const contractUrl = (cf?.[urlKey] as string) ?? "";
    const isEmpfehlung = source.toLowerCase().includes("empfehlung");
    const empfehlungBonus = isEmpfehlung ? 200 : 0;

    const baseAmount = closerRule
      ? Math.round(0.5 * fin.setupFee + (fin.contractDuration / 6) * fin.monthlyValue)
      : deal.value ?? 0;
    const amount = baseAmount + empfehlungBonus;

    const rep = (deal as any).users
      ? userName((deal as any).users.first_name, (deal as any).users.last_name)
      : "–";
    return {
      date: deal.closed_at ? formatDateShort(deal.closed_at) : "–",
      type: "Umsatzbonus",
      ref: `${rep} / ${(deal as any).leads?.lead_name ?? "Deal"}`,
      closeLeadId: (deal as any).leads?.close_lead_id ?? "",
      amount,
      oppValue: deal.value ?? 0,
      setupFee: fin.setupFee,
      monthlyValue: fin.monthlyValue,
      contractDuration: fin.contractDuration,
      source,
      contractUrl,
      empfehlungBonus,
    };
  });
}

/* ─── PROVISION TRANSACTIONS (Coldcaller) ─── */

export async function fetchCallerProvisionTransactions(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<ProvisionTransaction[]> {
  // Fetch EG stattgefunden + EG_NOSHOW + ET/FT activity type IDs
  const [egTypeRes, noShowTypeRes, etTypeRes, ftTypeRes] = await Promise.all([
    supabase.from("custom_activity_types").select("id").eq("close_type_id", CLOSE_ACTIVITY_TYPES.ERSTGESPRAECH).single(),
    supabase.from("custom_activity_types").select("id").eq("close_type_id", CLOSE_ACTIVITY_TYPES.EG_NOSHOW).single(),
    supabase.from("custom_activity_types").select("id").eq("close_type_id", CLOSE_ACTIVITY_TYPES.EG_VEREINBART_ET).single(),
    supabase.from("custom_activity_types").select("id").eq("close_type_id", CLOSE_ACTIVITY_TYPES.EG_VEREINBART_FT).single(),
  ]);

  const toDate = filters.to + "T23:59:59";
  const transactions: ProvisionTransaction[] = [];

  const egCallerKey = `custom.${CLOSE_CALLER_FIELDS.EG_VEREINBART_VON_EG}`;
  const noShowCallerKey = `custom.${CLOSE_CALLER_FIELDS.EG_VEREINBART_VON_NOSHOW}`;
  const etCallerKey = `custom.${CLOSE_CALLER_FIELDS.EG_VEREINBART_VON_ET}`;

  // Resolve selected rep's close_user_id for filtering
  let repCloseUserId: string | null = null;
  if (filters.rep !== "Alle") {
    const { data: repUser } = await supabase
      .from("users")
      .select("close_user_id")
      .eq("id", filters.rep)
      .single();
    repCloseUserId = repUser?.close_user_id ?? null;
  }

  // Build supabaseId → closeUserId map for FT attribution
  const { data: callerUsers } = await supabase
    .from("users")
    .select("id, close_user_id")
    .eq("role", "caller");
  const supaToCloseMap = new Map<string, string>();
  for (const u of callerUsers ?? []) supaToCloseMap.set(u.id, u.close_user_id);

  const queries: any[] = [];

  if (egTypeRes.data) {
    queries.push(
      supabase
        .from("custom_activities")
        .select("custom_fields, close_created_at, leads(lead_name, close_lead_id)")
        .eq("type_id", egTypeRes.data.id)
        .gte("close_created_at", filters.from)
        .lte("close_created_at", toDate)
        .order("close_created_at", { ascending: false })
    );
  } else {
    queries.push(Promise.resolve({ data: [] }));
  }

  if (noShowTypeRes.data) {
    queries.push(
      supabase
        .from("custom_activities")
        .select("custom_fields, close_created_at, leads(lead_name, close_lead_id)")
        .eq("type_id", noShowTypeRes.data.id)
        .gte("close_created_at", filters.from)
        .lte("close_created_at", toDate)
        .order("close_created_at", { ascending: false })
    );
  } else {
    queries.push(Promise.resolve({ data: [] }));
  }

  // Won opportunities in date range for Neukunden
  queries.push(
    supabase
      .from("opportunities")
      .select("lead_id, closed_at, leads(lead_name, close_lead_id)")
      .ilike("status", "%Won%")
      .gte("closed_at", filters.from)
      .lte("closed_at", toDate)
  );

  const [egRes, noShowRes, wonRes] = await Promise.all(queries);

  for (const row of egRes.data ?? []) {
    if (repCloseUserId) {
      const callerId = (row.custom_fields as any)?.[egCallerKey] as string | undefined;
      if (callerId !== repCloseUserId) continue;
    }
    transactions.push({
      date: row.close_created_at ? formatDateShort(row.close_created_at) : "–",
      type: "EG stattgefunden",
      ref: (row as any).leads?.lead_name ?? "–",
      closeLeadId: (row as any).leads?.close_lead_id ?? "",
      amount: 60,
    });
  }

  for (const row of noShowRes.data ?? []) {
    if (repCloseUserId) {
      const callerId = (row.custom_fields as any)?.[noShowCallerKey] as string | undefined;
      if (callerId !== repCloseUserId) continue;
    }
    transactions.push({
      date: row.close_created_at ? formatDateShort(row.close_created_at) : "–",
      type: "EG no show",
      ref: (row as any).leads?.lead_name ?? "–",
      closeLeadId: (row as any).leads?.close_lead_id ?? "",
      amount: -10,
    });
  }

  // Neukunden: +200€ per won lead attributed to the coldcaller
  const wonLeadIds = Array.from(new Set(
    (wonRes.data ?? []).map((o: any) => o.lead_id).filter(Boolean) as string[]
  ));
  const wonLeadMap = new Map<string, { closedAt: string; leadName: string; closeLeadId: string }>();
  for (const o of wonRes.data ?? []) {
    if (o.lead_id) wonLeadMap.set(o.lead_id, {
      closedAt: o.closed_at ?? "",
      leadName: (o as any).leads?.lead_name ?? "–",
      closeLeadId: (o as any).leads?.close_lead_id ?? "",
    });
  }

  if (wonLeadIds.length > 0) {
    const etId = etTypeRes.data?.id;
    const ftId = ftTypeRes.data?.id;
    const typeIds = [etId, ftId].filter(Boolean) as string[];
    if (typeIds.length > 0) {
      const { data: egVonActivities } = await supabase
        .from("custom_activities")
        .select("lead_id, user_id, custom_fields, type_id")
        .in("type_id", typeIds)
        .in("lead_id", wonLeadIds);

      // Find unique leads per coldcaller
      const seenLeads = new Set<string>();
      for (const row of egVonActivities ?? []) {
        if (!row.lead_id || seenLeads.has(row.lead_id)) continue;
        let callerId: string | undefined;
        if (ftId && row.type_id === ftId) {
          callerId = supaToCloseMap.get(row.user_id);
        } else {
          callerId = (row.custom_fields as any)?.[etCallerKey] as string | undefined;
        }
        if (!callerId) continue;
        if (repCloseUserId && callerId !== repCloseUserId) continue;
        seenLeads.add(row.lead_id);
        const wonInfo = wonLeadMap.get(row.lead_id);
        transactions.push({
          date: wonInfo?.closedAt ? formatDateShort(wonInfo.closedAt) : "–",
          type: "Neukunde",
          ref: wonInfo?.leadName ?? "–",
          closeLeadId: wonInfo?.closeLeadId ?? "",
          amount: 200,
        });
      }
    }
  }

  return transactions.sort((a, b) => (b.date > a.date ? 1 : -1));
}

/* ─── PROVISION TRANSACTIONS (legacy — kept for backwards compat) ─── */

export async function fetchProvisionTransactions(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<ProvisionTransaction[]> {
  return fetchCloserProvisionTransactions(supabase, filters);
}
