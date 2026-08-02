import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useCreateDataset } from "../hooks/useDatasets";

export function NewDatasetModal({ projectId, onClose, onCreated }: { projectId: number; onClose: () => void; onCreated: (id: number) => void }) {
  const [name, setName] = useState("");
  const createDataset = useCreateDataset(projectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const dataset = await createDataset.mutateAsync(name.trim());
    onClose();
    onCreated(dataset.id);
  }

  return (
    <Modal title="New dataset" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-secondary font-medium text-ink">Dataset name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Survey responses"
            className="h-10 rounded-md border border-surface-border px-3 text-body outline-none focus:border-brand-500"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || createDataset.isPending}>
            {createDataset.isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
