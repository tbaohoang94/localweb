"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeType = "default" | "success" | "warning" | "danger" | "info";

interface BadgeStatusProps {
  label: string;
  type?: BadgeType;
}

const variants: Record<BadgeType, string> = {
  default: "bg-muted text-muted-foreground border-transparent",
  success: "bg-success/10 text-success border-transparent",
  warning: "bg-warning/10 text-warning border-transparent",
  danger: "bg-destructive/10 text-destructive border-transparent",
  info: "bg-primary/10 text-primary border-transparent",
};

export default function BadgeStatus({ label, type = "default" }: BadgeStatusProps) {
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold", variants[type])}>
      {label}
    </Badge>
  );
}
