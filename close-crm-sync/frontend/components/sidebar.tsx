"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Target,
  Phone,
  Handshake,
  Wallet,
  GraduationCap,
  ScrollText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ViewId =
  | "controlling"
  | "opportunities"
  | "coldcaller"
  | "closer"
  | "provisionen-closer"
  | "provisionen-caller"
  | "1on1"
  | "custom-activities"
  | "logs";

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof BarChart3 }[] = [
  { id: "controlling", label: "Controlling", icon: BarChart3 },
  { id: "opportunities", label: "Opportunities", icon: Target },
  { id: "coldcaller", label: "Coldcaller", icon: Phone },
  { id: "closer", label: "Closer", icon: Handshake },
  { id: "provisionen-closer", label: "Prov. Closer", icon: Wallet },
  { id: "provisionen-caller", label: "Prov. Coldcaller", icon: Wallet },
  { id: "1on1", label: "1:1 Coaching", icon: GraduationCap },
  { id: "custom-activities", label: "Activities", icon: ClipboardList },
  { id: "logs", label: "Logs", icon: ScrollText },
];

interface SidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ease-in-out shrink-0 h-screen sticky top-0",
          collapsed ? "w-[68px]" : "w-[220px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-sm font-bold">V</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sidebar-fg text-sm font-semibold leading-tight truncate">
                Vertrieb OS
              </p>
              <p className="text-sidebar-muted text-[10px] mt-0.5">
                Sales Platform
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            const btn = (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                  isActive
                    ? "bg-primary/15 text-white font-medium"
                    : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-fg"
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.id}>{btn}</div>;
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-fg transition-colors"
              >
                {mounted && theme === "dark" ? (
                  <Sun size={18} className="shrink-0" />
                ) : (
                  <Moon size={18} className="shrink-0" />
                )}
                {!collapsed && <span>Theme</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={8}>
                Theme wechseln
              </TooltipContent>
            )}
          </Tooltip>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
            className="w-full justify-start gap-3 text-sidebar-muted hover:text-sidebar-fg hover:bg-white/[0.06] h-9"
          >
            {collapsed ? (
              <ChevronRight size={18} className="shrink-0" />
            ) : (
              <>
                <ChevronLeft size={18} className="shrink-0" />
                <span className="text-sm">Einklappen</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
