import type { LucideIcon } from "lucide-react";

export function ComingSoon({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-surface-border bg-surface-card px-10 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-heading-sm text-ink">{title}</p>
      <p className="max-w-sm text-secondary text-ink-muted">{description}</p>
    </div>
  );
}
