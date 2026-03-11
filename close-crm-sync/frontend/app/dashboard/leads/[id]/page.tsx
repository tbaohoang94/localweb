import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import LeadDetail from "@/components/leads/lead-detail";

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [leadRes, oppsRes, activitiesRes] = await Promise.all([
    supabase.from("leads").select("*").eq("id", params.id).single(),
    supabase
      .from("opportunities")
      .select("*")
      .eq("lead_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("custom_activities")
      .select("*")
      .is("deleted_at", null)
      .eq("lead_id", params.id)
      .order("date", { ascending: false })
      .limit(20),
  ]);

  if (!leadRes.data) {
    notFound();
  }

  return (
    <LeadDetail
      lead={leadRes.data}
      opportunities={oppsRes.data ?? []}
      activities={activitiesRes.data ?? []}
    />
  );
}
