"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/locations", label: "Locations" },
  { href: "/dashboard/businesses", label: "Businesses" },
  { href: "/dashboard/runs", label: "Runs" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r min-h-screen flex flex-col">
      <div className="p-5 border-b">
        <h1 className="font-bold text-lg">Maps Pipeline</h1>
      </div>
      <nav className="flex-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm mb-1 ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-5 border-t">
        <LogoutButton />
      </div>
    </aside>
  );
}
