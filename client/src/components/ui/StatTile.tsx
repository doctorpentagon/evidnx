import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

export function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-heading-sm leading-none text-ink">{value}</p>
        <p className="mt-1 text-helper text-ink-muted">{label}</p>
      </div>
    </Card>
  );
}
