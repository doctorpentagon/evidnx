import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { Question, QuestionType } from "../types/questionnaire";

const typeLabels: Record<QuestionType, string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  likert5: "Likert (5-point)",
  text: "Open text",
  numeric: "Numeric",
};

const hasOptions = (type: QuestionType) => type === "single_choice" || type === "multiple_choice";

function slugifyVariableName(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "question";
}

export function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
  dragHandleProps,
}: {
  question: Question;
  index: number;
  onChange: (next: Question) => void;
  onRemove: () => void;
  dragHandleProps: {
    draggable: true;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
  };
}) {
  return (
    <div
      {...dragHandleProps}
      className="flex gap-3 rounded-lg border border-surface-border bg-surface-card p-4"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="mt-1 cursor-grab text-ink-muted hover:text-ink active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-helper font-semibold text-ink-muted">Q{index + 1}</span>
          <select
            value={question.type}
            onChange={(e) => {
              const type = e.target.value as QuestionType;
              onChange({ ...question, type, options: hasOptions(type) ? question.options ?? ["Option 1", "Option 2"] : undefined });
            }}
            className="ml-auto h-8 rounded-md border border-surface-border px-2 text-helper"
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button type="button" onClick={onRemove} aria-label="Remove question" className="text-ink-muted hover:text-error-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <input
          value={question.text}
          onChange={(e) => {
            const text = e.target.value;
            const autoVar = slugifyVariableName(question.text) === question.variableName || !question.variableName;
            onChange({ ...question, text, variableName: autoVar ? slugifyVariableName(text) : question.variableName });
          }}
          placeholder="Question text"
          className="h-10 rounded-md border border-surface-border px-3 text-body outline-none focus:border-brand-500"
        />

        {hasOptions(question.type) ? (
          <div className="flex flex-col gap-2">
            {(question.options ?? []).map((opt, optIndex) => (
              <div key={optIndex} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={(e) => {
                    const options = [...(question.options ?? [])];
                    options[optIndex] = e.target.value;
                    onChange({ ...question, options });
                  }}
                  className="h-9 flex-1 rounded-md border border-surface-border px-3 text-secondary outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const options = (question.options ?? []).filter((_, i) => i !== optIndex);
                    onChange({ ...question, options });
                  }}
                  className="text-ink-muted hover:text-error-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange({ ...question, options: [...(question.options ?? []), `Option ${(question.options?.length ?? 0) + 1}`] })}
              className="flex w-fit items-center gap-1 text-helper font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add option
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 text-helper text-ink-muted">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onChange({ ...question, required: e.target.checked })}
            />
            Required
          </label>
          <label className="flex items-center gap-1.5">
            Variable:
            <input
              value={question.variableName}
              onChange={(e) => onChange({ ...question, variableName: slugifyVariableName(e.target.value) })}
              className="h-7 w-40 rounded border border-surface-border px-2 font-mono text-helper"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
