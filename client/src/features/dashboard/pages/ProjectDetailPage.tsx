import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, BookOpen, ClipboardList, Database, FileText } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useCurrentProject } from "@/providers/CurrentProjectContext";
import type { Project } from "../types/project";

const quickLinks = [
  { to: "/questionnaires", label: "Questionnaires", icon: ClipboardList },
  { to: "/data", label: "Data", icon: Database },
  { to: "/analysis", label: "Analysis", icon: BarChart3 },
  { to: "/literature", label: "Literature", icon: BookOpen },
  { to: "/reports", label: "Reports", icon: FileText },
];

export function ProjectDetailPage() {
  const { id } = useParams();
  const { setCurrentProjectId } = useCurrentProject();
  const { data: project, isLoading } = useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Project>>(`/projects/${id}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (id) setCurrentProjectId(Number(id));
  }, [id, setCurrentProjectId]);

  if (isLoading) return <p className="text-secondary text-ink-muted">Loading…</p>;
  if (!project) return <p className="text-secondary text-ink-muted">Project not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <Link to="/" className="flex w-fit items-center gap-1.5 text-secondary text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <div>
        <h1 className="text-heading-lg text-ink">{project.name}</h1>
        {project.topic ? <p className="mt-1 text-body text-ink-muted">{project.topic}</p> : null}
      </div>
      <p className="text-secondary text-ink-muted">
        {project.stats.datasetCount} dataset{project.stats.datasetCount === 1 ? "" : "s"} ·{" "}
        {project.stats.analysisCount} analys{project.stats.analysisCount === 1 ? "is" : "es"} ·{" "}
        {project.stats.responseCount} response{project.stats.responseCount === 1 ? "" : "s"}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {quickLinks.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex flex-col items-center gap-2 p-5 text-center transition-shadow hover:shadow-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-500">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-secondary font-medium text-ink">{label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
