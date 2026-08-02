import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useCreateQuestionnaire } from "../hooks/useQuestionnaires";

export function NewQuestionnaireModal({ projectId, onClose }: { projectId: number; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createQuestionnaire = useCreateQuestionnaire(projectId);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const questionnaire = await createQuestionnaire.mutateAsync({ title: title.trim(), description: description.trim() || undefined });
    onClose();
    navigate(`/questionnaires/${questionnaire.id}`);
  }

  return (
    <Modal title="New questionnaire" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-secondary font-medium text-ink">Title</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Customer satisfaction survey"
            className="h-10 rounded-md border border-surface-border px-3 text-body outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-secondary font-medium text-ink">Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-md border border-surface-border px-3 py-2 text-body outline-none focus:border-brand-500"
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || createQuestionnaire.isPending}>
            {createQuestionnaire.isPending ? "Creating…" : "Create questionnaire"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
