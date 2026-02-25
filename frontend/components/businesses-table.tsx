"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Business = {
  id: string;
  place_id: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
};

export default function BusinessesTable() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      let q = supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (search) q = q.ilike("name", `%${search}%`);
      if (cityFilter) q = q.eq("city", cityFilter);
      if (categoryFilter) q = q.ilike("category", `%${categoryFilter}%`);

      const { data } = await q;
      if (data) setBusinesses(data);
      setLoading(false);
    }

    const timeout = setTimeout(fetch, 300);
    return () => clearTimeout(timeout);
  }, [search, cityFilter, categoryFilter]);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          placeholder="Search name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
        />
        <input
          placeholder="Filter city..."
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-40"
        />
        <input
          placeholder="Filter category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-40"
        />
        <span className="text-sm text-gray-400 self-center">
          {businesses.length} results
        </span>
      </div>

      {businesses.length === 0 ? (
        <p className="text-gray-500">No businesses found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">City</th>
                <th className="pb-3 pr-4">Phone</th>
                <th className="pb-3 pr-4">Website</th>
                <th className="pb-3 pr-4 text-right">Rating</th>
                <th className="pb-3 pr-4 text-right">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((biz) => (
                <tr key={biz.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{biz.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{biz.category || "—"}</td>
                  <td className="py-3 pr-4">{biz.city || "—"}</td>
                  <td className="py-3 pr-4">{biz.phone || "—"}</td>
                  <td className="py-3 pr-4">
                    {biz.website ? (
                      <a
                        href={biz.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate block max-w-[200px]"
                      >
                        {biz.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right">{biz.rating ?? "—"}</td>
                  <td className="py-3 pr-4 text-right">{biz.reviews_count ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
