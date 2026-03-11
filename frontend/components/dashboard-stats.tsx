"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Stats = {
  businessesThisMonth: number;
  loading: boolean;
};

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    businessesThisMonth: 0,
    loading: true,
  });
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthISO = startOfMonth.toISOString();

      const { count, error } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonthISO);

      if (!error && count !== null) {
        setStats({ businessesThisMonth: count, loading: false });
      } else {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Businesses diesen Monat" value="..." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        title="Businesses diesen Monat"
        value={stats.businessesThisMonth.toLocaleString("de-DE")}
      />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
