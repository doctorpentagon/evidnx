import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useShareInfo } from "../hooks/useQuestionnaire";

export function ShareModal({ questionnaireId, onClose }: { questionnaireId: number; onClose: () => void }) {
  const { data: share, isLoading } = useShareInfo(questionnaireId, true);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!share) return;
    await navigator.clipboard.writeText(share.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal title="Share questionnaire" onClose={onClose}>
      {isLoading || !share ? (
        <p className="text-secondary text-ink-muted">Generating link…</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <img src={share.qrCodeDataUrl} alt="QR code" className="h-40 w-40 rounded-md border border-surface-border" />
          <div className="flex w-full items-center gap-2">
            <input
              readOnly
              value={share.url}
              className="h-10 flex-1 rounded-md border border-surface-border px-3 text-secondary text-ink-muted"
            />
            <button
              onClick={copyLink}
              className="flex h-10 items-center gap-1.5 rounded-md bg-brand-500 px-3 text-secondary font-medium text-white hover:bg-brand-600"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-center text-helper text-ink-muted">
            Anyone with this link can respond — no account needed.
          </p>
        </div>
      )}
    </Modal>
  );
}
