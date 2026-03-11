import PipelineOverview from "@/components/pipeline-overview";
import SearchOverview from "@/components/search-overview";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-sm font-semibold">Dashboard</h1>
      <PipelineOverview />
      <SearchOverview />
    </div>
  );
}
