import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ComingSoon } from "@/components/ComingSoon";
import { useCurrentProject } from "@/providers/CurrentProjectContext";
import { useQuestionnaires } from "../hooks/useQuestionnaires";
import { NewQuestionnaireModal } from "../components/NewQuestionnaireModal";

export function QuestionnairesListPage() {
  const { currentProjectId } = useCurrentProject();
  const { data: questionnaires, isLoading } = useQuestionnaires(currentProjectId);
  const [showNew, setShowNew] = useState(false);

  if (currentProjectId === null) {
    return (
      <ComingSoon
        icon={ClipboardList}
        title="No project selected"
        description="Open a project from the Dashboard first — questionnaires belong to a project."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg text-ink">Questionnaires</h1>
          <p className="mt-1 text-body text-ink-muted">Design a form, collect responses, feed straight into Analysis.</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> New questionnaire
        </Button>
      </div>

      {isLoading ? (
        <p className="text-secondary text-ink-muted">Loading…</p>
      ) : questionnaires && questionnaires.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {questionnaires.map((q) => (
            <Link key={q.id} to={`/questionnaires/${q.id}`}>
              <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-heading-sm text-ink">{q.title}</p>
                  <Badge tone={q.status === "published" ? "ai" : "neutral"}>{q.status}</Badge>
                </div>
                {q.description ? <p className="line-clamp-2 text-secondary text-ink-muted">{q.description}</p> : null}
                <p className="mt-auto text-helper text-ink-muted">
                  {q.responseCount} response{q.responseCount === 1 ? "" : "s"}
                  {q.targetSampleSize ? ` of ${q.targetSampleSize} target` : ""}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <ComingSoon
          icon={ClipboardList}
          title="No questionnaires yet"
          description="Build a question set, publish it, and collect real responses straight into a dataset."
        />
      )}

      {showNew ? <NewQuestionnaireModal projectId={currentProjectId} onClose={() => setShowNew(false)} /> : null}
    </div>
  );
}
