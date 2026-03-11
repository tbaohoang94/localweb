import { createClient } from "@/lib/supabase-server";
import LeadsTable from "@/components/leads/leads-table";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const supabase = createClient();
  const page = parseInt(searchParams.page || "1", 10);
  const search = searchParams.search || "";
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (search) {
    query = query.ilike("lead_name", `%${search}%`);
  }

  const { data, count } = await query;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
        <p className="text-sm text-gray-500 mt-1">
          All leads synced from Close.io
        </p>
      </div>
      <LeadsTable
        leads={data ?? []}
        totalCount={count ?? 0}
        page={page}
        search={search}
      />
    </div>
  );
}
