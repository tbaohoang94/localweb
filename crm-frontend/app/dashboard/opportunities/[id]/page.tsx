import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import OpportunityDetail from "@/components/opportunities/opportunity-detail";

export default async function OpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const oppRes = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!oppRes.data) {
    notFound();
  }

  const [leadRes, activitiesRes] = await Promise.all([
    oppRes.data.lead_id
      ? supabase
          .from("leads")
          .select("id, lead_name")
          .eq("id", oppRes.data.lead_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("custom_activities")
      .select("*")
      .eq("lead_id", oppRes.data.lead_id || "")
      .order("date", { ascending: false })
      .limit(20),
  ]);

  return (
    <OpportunityDetail
      opportunity={oppRes.data}
      lead={leadRes.data}
      activities={activitiesRes.data ?? []}
    />
  );
}
