"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  variant?: "primary" | "success" | "warning" | "destructive";
}

export default function ProgressBar({
  value,
  max,
  className,
  variant = "primary",
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const colors = {
    primary: "from-primary to-primary/80",
    success: "from-success to-success/80",
    warning: "from-warning to-warning/80",
    destructive: "from-destructive to-destructive/80",
  };

  return (
    <div className={cn("h-2 bg-muted rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
          colors[variant]
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
