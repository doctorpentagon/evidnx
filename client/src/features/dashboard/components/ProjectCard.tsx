import { Link } from "react-router-dom";
import { Database, FlaskConical, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Project } from "../types/project";

const typeLabel: Record<Project["projectType"], string> = {
  research: "Research project",
  business: "Business report",
  personal: "Personal project",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-heading-sm text-ink">{project.name}</p>
            {project.topic ? (
              <p className="mt-1 line-clamp-2 text-secondary text-ink-muted">{project.topic}</p>
            ) : null}
          </div>
          <Badge tone="brand" className="shrink-0">
            {typeLabel[project.projectType]}
          </Badge>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface-border pt-3 text-helper text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" /> {project.stats.datasetCount} dataset
            {project.stats.datasetCount === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> {project.stats.analysisCount} analys
            {project.stats.analysisCount === 1 ? "is" : "es"}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {project.stats.responseCount} response
            {project.stats.responseCount === 1 ? "" : "s"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
