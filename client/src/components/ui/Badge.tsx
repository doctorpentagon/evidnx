import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type Tone = "brand" | "ai" | "warning" | "error" | "neutral";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  ai: "bg-ai-50 text-ai-700",
  warning: "bg-warning-50 text-warning-600",
  error: "bg-error-50 text-error-600",
  neutral: "bg-surface-canvas text-ink-muted",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-helper font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
