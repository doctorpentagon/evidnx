import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type Variant = "primary" | "ai" | "outline" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500",
  ai: "bg-ai-500 text-white hover:bg-ai-600 focus-visible:ring-ai-500",
  outline: "border border-surface-border bg-surface-card text-ink hover:bg-surface-canvas",
  ghost: "text-ink-muted hover:bg-surface-canvas hover:text-ink",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-10 px-3 text-secondary",
  md: "min-h-11 px-5 text-body",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-fast disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
