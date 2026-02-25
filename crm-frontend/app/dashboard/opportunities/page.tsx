import { createClient } from "@/lib/supabase-server";
import OpportunitiesTable from "@/components/opportunities/opportunities-table";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const supabase = createClient();
  const page = parseInt(searchParams.page || "1", 10);
  const status = searchParams.status || "";
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("opportunities")
    .select("*, leads(lead_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, count } = await query;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Opportunities</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pipeline overview from Close.io
        </p>
      </div>
      <OpportunitiesTable
        opportunities={data ?? []}
        totalCount={count ?? 0}
        page={page}
        status={status}
      />
    </div>
  );
}
