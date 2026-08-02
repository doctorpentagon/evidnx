import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useQuestionnaire, useResponseStats, useUpdateQuestionnaire } from "../hooks/useQuestionnaire";
import { QuestionEditor } from "../components/QuestionEditor";
import { SuggestionsPanel } from "../components/SuggestionsPanel";
import { ShareModal } from "../components/ShareModal";
import type { Question } from "../types/questionnaire";

const blankQuestion = (): Question => ({
  type: "text",
  text: "",
  required: true,
  variableName: "question",
});

export function QuestionnaireBuilderPage() {
  const { id } = useParams();
  const questionnaireId = Number(id);
  const { data: questionnaire, isLoading } = useQuestionnaire(questionnaireId);
  const { data: stats } = useResponseStats(questionnaireId);
  const updateQuestionnaire = useUpdateQuestionnaire(questionnaireId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dirty, setDirty] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (questionnaire && !loadedRef.current) {
      setTitle(questionnaire.title);
      setDescription(questionnaire.description ?? "");
      setQuestions(questionnaire.questions);
      loadedRef.current = true;
    }
  }, [questionnaire]);

  function updateQuestion(index: number, next: Question) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? next : q)));
    setDirty(true);
  }

  function removeQuestion(index: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== index));
    setDirty(true);
  }

  function addQuestion(question: Question) {
    setQuestions((qs) => [...qs, question]);
    setDirty(true);
  }

  function reorder(from: number, to: number) {
    setQuestions((qs) => {
      const copy = [...qs];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
    setDirty(true);
  }

  async function handleSave() {
    await updateQuestionnaire.mutateAsync({ title, description, questions });
    setDirty(false);
  }

  async function togglePublish() {
    await updateQuestionnaire.mutateAsync({ status: questionnaire?.status === "published" ? "draft" : "published" });
  }

  if (isLoading || !questionnaire) return <p className="text-secondary text-ink-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/questionnaires" className="flex w-fit items-center gap-1.5 text-secondary text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to questionnaires
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowShare(true)} disabled={questionnaire.status !== "published"}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button variant={questionnaire.status === "published" ? "outline" : "ai"} onClick={togglePublish}>
            {questionnaire.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button onClick={handleSave} disabled={!dirty || updateQuestionnaire.isPending}>
            <Save className="h-4 w-4" /> {updateQuestionnaire.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          className="w-full max-w-lg border-b border-transparent bg-transparent text-heading-lg text-ink outline-none focus:border-brand-500"
        />
        <Badge tone={questionnaire.status === "published" ? "ai" : "neutral"}>{questionnaire.status}</Badge>
      </div>
      <textarea
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          setDirty(true);
        }}
        placeholder="Add a description…"
        rows={2}
        className="max-w-lg resize-none bg-transparent text-body text-ink-muted outline-none"
      />

      {stats ? (
        <Card className="flex items-center gap-4 p-4">
          <div className="flex-1">
            <p className="text-secondary text-ink-muted">
              {stats.responseCount} response{stats.responseCount === 1 ? "" : "s"}
              {stats.targetSampleSize ? ` of ${stats.targetSampleSize} target` : ""}
            </p>
            {stats.completionPercent !== null ? (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-canvas">
                <div className="h-full rounded-full bg-ai-500" style={{ width: `${stats.completionPercent}%` }} />
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <SuggestionsPanel questionnaireId={questionnaireId} onAdd={addQuestion} />

      <div className="flex flex-col gap-3">
        {questions.map((q, index) => (
          <QuestionEditor
            key={index}
            index={index}
            question={q}
            onChange={(next) => updateQuestion(index, next)}
            onRemove={() => removeQuestion(index)}
            dragHandleProps={{
              draggable: true,
              onDragStart: () => {
                dragIndex.current = index;
              },
              onDragOver: (e) => e.preventDefault(),
              onDrop: () => {
                if (dragIndex.current !== null && dragIndex.current !== index) reorder(dragIndex.current, index);
                dragIndex.current = null;
              },
            }}
          />
        ))}
      </div>

      <Button variant="outline" className="w-fit" onClick={() => addQuestion(blankQuestion())}>
        <Plus className="h-4 w-4" /> Add question
      </Button>

      {showShare ? <ShareModal questionnaireId={questionnaireId} onClose={() => setShowShare(false)} /> : null}
    </div>
  );
}
