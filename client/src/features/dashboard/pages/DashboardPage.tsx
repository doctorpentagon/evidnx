import { useState } from "react";
import { BarChart3, FolderKanban, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { useProjects } from "../hooks/useProjects";
import { ProjectCard } from "../components/ProjectCard";
import { NewProjectModal } from "../components/NewProjectModal";

export function DashboardPage() {
  const { data: projects, isLoading, isError } = useProjects();
  const [showNewProject, setShowNewProject] = useState(false);

  const activeCount = projects?.filter((p) => p.status === "active").length ?? 0;
  const responseCount = projects?.reduce((sum, p) => sum + p.stats.responseCount, 0) ?? 0;
  const analysisCount = projects?.reduce((sum, p) => sum + p.stats.analysisCount, 0) ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading-lg text-ink">Dashboard</h1>
          <p className="mt-1 text-body text-ink-muted">Continue where you left off, or start something new.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setShowNewProject(true)}>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Active projects" value={activeCount} icon={FolderKanban} />
        <StatTile label="Responses collected" value={responseCount} icon={Users} />
        <StatTile label="Analyses run" value={analysisCount} icon={BarChart3} />
      </div>

      <div>
        <h2 className="mb-4 text-heading-sm text-ink">Your projects</h2>
        {isLoading ? (
          <p className="text-secondary text-ink-muted">Loading projects…</p>
        ) : isError ? (
          <p className="text-secondary text-error-600">
            Couldn't reach the server. Make sure the API is running on port 4000.
          </p>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-surface-border bg-surface-card p-10 text-center">
            <p className="text-heading-sm text-ink">No projects yet</p>
            <p className="mx-auto mt-2 max-w-sm text-secondary text-ink-muted">
              Turn raw data into a defensible written result — start with a questionnaire or import a
              dataset directly.
            </p>
            <Button className="mt-4" onClick={() => setShowNewProject(true)}>
              <Plus className="h-4 w-4" /> New project
            </Button>
          </div>
        )}
      </div>

      {showNewProject ? <NewProjectModal onClose={() => setShowNewProject(false)} /> : null}
    </div>
  );
}
