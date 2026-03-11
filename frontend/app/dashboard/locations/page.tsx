import LocationsTable from "@/components/locations-table";

export default function LocationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Locations & Keywords</h1>
      <div className="bg-white rounded-lg border p-6">
        <LocationsTable />
      </div>
    </div>
  );
}
