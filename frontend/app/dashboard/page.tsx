import ScrapeRunsTable from "@/components/scrape-runs-table";
import DashboardStats from "@/components/dashboard-stats";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <DashboardStats />
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Scrape Runs</h2>
        <ScrapeRunsTable />
      </div>
    </div>
  );
}
