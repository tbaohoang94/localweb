import BusinessesTable from "@/components/businesses-table";

export default function BusinessesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Businesses</h1>
      <div className="bg-white rounded-lg border p-6">
        <BusinessesTable />
      </div>
    </div>
  );
}
