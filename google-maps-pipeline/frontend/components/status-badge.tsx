import { getStageBadgeClass, getStageLabel } from "@/lib/pipeline-stages";

/** Wiederverwendbare StatusBadge fuer Pipeline-Stages. */
export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageBadgeClass(status)}`}>
      {getStageLabel(status)}
    </span>
  );
}
