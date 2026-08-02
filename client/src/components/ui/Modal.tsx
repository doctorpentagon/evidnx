import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Card } from "./Card";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-heading-sm text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-ink-muted hover:bg-surface-canvas"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}
