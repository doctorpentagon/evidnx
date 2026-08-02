import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { twMerge } from "tailwind-merge";

/**
 * The single most-repeated component in the mockups (SPEC.md §9): a
 * light-blue tinted box with a circular "+"/sparkle icon avatar, used for
 * AI Interpretation, suggested questions, auto-analyze recommendations, etc.
 */
export function AiPanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={twMerge("flex gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 text-secondary text-ink-secondary">
        {title ? <p className="mb-1 font-semibold text-ink">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}
