import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useCreateProject } from "../hooks/useProjects";
import type { ProjectType } from "../types/project";

const typeOptions: { value: ProjectType; label: string }[] = [
  { value: "research", label: "Research project" },
  { value: "business", label: "Business report" },
  { value: "personal", label: "Personal project" },
];

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("research");
  const navigate = useNavigate();
  const createProject = useCreateProject();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const project = await createProject.mutateAsync({ name: name.trim(), topic: topic.trim() || undefined, projectType });
    onClose();
    navigate(`/projects/${project.id}`);
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-secondary font-medium text-ink">Project name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sleep & Productivity Study"
            className="h-10 rounded-md border border-surface-border px-3 text-body outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-secondary font-medium text-ink">Topic (optional)</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What are you working on?"
            className="h-10 rounded-md border border-surface-border px-3 text-body outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-secondary font-medium text-ink">What are you working on?</span>
          <div className="flex gap-2">
            {typeOptions.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setProjectType(opt.value)}
                className={`flex-1 rounded-md border px-2 py-2 text-helper font-medium transition-colors ${
                  projectType === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-surface-border text-ink-muted hover:bg-surface-canvas"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || createProject.isPending}>
            {createProject.isPending ? "Creating…" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
