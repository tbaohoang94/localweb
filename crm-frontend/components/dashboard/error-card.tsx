import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="p-8 flex flex-col items-center gap-3 text-center">
      <AlertTriangle className="w-8 h-8 text-destructive" />
      <p className="text-sm font-semibold text-destructive">Fehler beim Laden</p>
      <p className="text-xs text-muted-foreground max-w-md">{message}</p>
    </Card>
  );
}
