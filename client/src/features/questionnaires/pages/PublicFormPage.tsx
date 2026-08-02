import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { questionnaireService } from "../services/questionnaire.service";

type AnswerValue = string | number | string[];

export function PublicFormPage() {
  const { slug } = useParams();
  const { data: form, isLoading, isError } = useQuery({
    queryKey: ["public-form", slug],
    queryFn: () => questionnaireService.getPublicForm(slug as string),
  });
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => questionnaireService.submitPublicResponse(slug as string, answers),
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(message ?? "Something went wrong submitting your response.");
    },
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading…</div>;
  if (isError || !form)
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">This form isn't available.</div>;

  if (submit.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-canvas p-6">
        <Card className="flex max-w-md flex-col items-center gap-3 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ai-50 text-ai-500">
            <Check className="h-6 w-6" />
          </span>
          <p className="text-heading-sm text-ink">Thanks for your response</p>
          <p className="text-secondary text-ink-muted">It's been recorded.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-surface-canvas p-6">
      <Card className="w-full max-w-lg p-8">
        <h1 className="text-heading text-ink">{form.title}</h1>
        {form.description ? <p className="mt-2 text-body text-ink-muted">{form.description}</p> : null}

        <form
          className="mt-6 flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            submit.mutate();
          }}
        >
          {form.questions.map((q) => (
            <label key={q.id} className="flex flex-col gap-2">
              <span className="font-medium text-ink">
                {q.text} {q.required ? <span className="text-error-600">*</span> : null}
              </span>
              {q.helpText ? <span className="text-helper text-ink-muted">{q.helpText}</span> : null}

              {q.type === "text" ? (
                <textarea
                  required={q.required}
                  rows={3}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  className="rounded-md border border-surface-border px-3 py-2 outline-none focus:border-brand-500"
                />
              ) : q.type === "numeric" ? (
                <input
                  type="number"
                  required={q.required}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: Number(e.target.value) }))}
                  className="h-10 rounded-md border border-surface-border px-3 outline-none focus:border-brand-500"
                />
              ) : q.type === "likert5" ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
                      className={`h-10 flex-1 rounded-md border text-secondary font-medium ${
                        answers[q.id] === n ? "border-brand-500 bg-brand-50 text-brand-700" : "border-surface-border text-ink-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : q.type === "single_choice" ? (
                <div className="flex flex-col gap-2">
                  {(q.options ?? []).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-secondary text-ink">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        required={q.required}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {(q.options ?? []).map((opt) => {
                    const current = (answers[q.id] as string[] | undefined) ?? [];
                    return (
                      <label key={opt} className="flex items-center gap-2 text-secondary text-ink">
                        <input
                          type="checkbox"
                          checked={current.includes(opt)}
                          onChange={(e) =>
                            setAnswers((a) => ({
                              ...a,
                              [q.id]: e.target.checked ? [...current, opt] : current.filter((o) => o !== opt),
                            }))
                          }
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}
            </label>
          ))}

          {error ? <p className="text-secondary text-error-600">{error}</p> : null}

          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
