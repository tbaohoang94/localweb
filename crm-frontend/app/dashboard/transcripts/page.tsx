import { createClient } from "@/lib/supabase-server";
import TranscriptsList from "@/components/transcripts/transcripts-list";

export default async function TranscriptsPage({
  searchParams,
}: {
  searchParams: { page?: string; source?: string };
}) {
  const supabase = createClient();
  const page = parseInt(searchParams.page || "1", 10);
  const source = searchParams.source || "";
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("transcripts")
    .select("*, leads(lead_name), close_users(name)", { count: "exact" })
    .order("date", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (source && source !== "all") {
    query = query.eq("source", source);
  }

  const { data, count } = await query;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Transcripts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Call transcripts from Close.io and Demodesk
        </p>
      </div>
      <TranscriptsList
        transcripts={data ?? []}
        totalCount={count ?? 0}
        page={page}
        source={source}
      />
    </div>
  );
}
