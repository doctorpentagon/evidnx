import { Plus } from "lucide-react";
import { AiPanel } from "@/components/ui/AiPanel";
import { useSuggestions } from "../hooks/useQuestionnaire";
import type { Question } from "../types/questionnaire";

export function SuggestionsPanel({ questionnaireId, onAdd }: { questionnaireId: number; onAdd: (question: Question) => void }) {
  const { data: suggestions, isLoading } = useSuggestions(questionnaireId);

  if (isLoading || !suggestions || suggestions.length === 0) return null;

  return (
    <AiPanel title="Suggested questions">
      <p className="mb-2">Keyword-matched against your questionnaire's topic — add any that fit.</p>
      <div className="flex flex-col gap-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-md bg-surface-card px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-ink">{s.text}</p>
              <p className="text-helper text-ink-muted">{s.note}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                onAdd({ type: s.type, text: s.text, required: true, variableName: s.variableName, options: s.type === "single_choice" ? ["Option 1", "Option 2"] : undefined })
              }
              className="flex shrink-0 items-center gap-1 rounded-md bg-brand-500 px-2.5 py-1.5 text-helper font-medium text-white hover:bg-brand-600"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        ))}
      </div>
    </AiPanel>
  );
}
