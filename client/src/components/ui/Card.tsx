import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        "rounded-lg border border-surface-border bg-surface-card shadow-card",
        className,
      )}
      {...props}
    />
  );
}
