"use client";

import { Card } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function ChartCard({ title, children, footer }: ChartCardProps) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <p className="text-sm font-semibold mb-4">{title}</p>
      {children}
      {footer && (
        <>
          <div className="h-px bg-border my-4" />
          {footer}
        </>
      )}
    </Card>
  );
}
