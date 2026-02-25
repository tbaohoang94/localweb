import RunsTable from "@/components/runs-table";

export default function RunsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Scrape Runs</h1>
      <div className="bg-white rounded-lg border p-6">
        <RunsTable />
      </div>
    </div>
  );
}
