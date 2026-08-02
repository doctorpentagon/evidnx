/** Rule-based question suggestions keyed on topic keywords - no LLM call
 * required, so this works with zero configuration. Mirrors the "AI
 * suggestions" panel from the mockups using genuine keyword-matched
 * templates instead of a live model call. */

interface SuggestionTemplate {
  keywords: string[];
  suggestions: { text: string; type: "numeric" | "likert5" | "single_choice"; variableName: string; note: string }[];
}

const TEMPLATES: SuggestionTemplate[] = [
  {
    keywords: ["business", "sme", "banking", "finance", "revenue", "sales", "transaction"],
    suggestions: [
      { text: "How many transactions does your business process monthly?", type: "numeric", variableName: "monthly_transactions", note: "Numeric · enables regression" },
      { text: "How many employees does your business have?", type: "numeric", variableName: "employee_count", note: "Numeric · control variable" },
      { text: "Which sector best describes your business?", type: "single_choice", variableName: "sector", note: "Category · segmentation" },
    ],
  },
  {
    keywords: ["health", "clinic", "patient", "hospital", "medical", "nurse"],
    suggestions: [
      { text: "How would you rate your overall health? (1 = poor, 5 = excellent)", type: "likert5", variableName: "self_rated_health", note: "Likert · outcome variable" },
      { text: "How many visits to a health provider have you had in the past year?", type: "numeric", variableName: "visits_past_year", note: "Numeric · usage measure" },
    ],
  },
  {
    keywords: ["education", "school", "learning", "student", "teacher", "course"],
    suggestions: [
      { text: "How many hours per week do you spend studying?", type: "numeric", variableName: "study_hours", note: "Numeric · predictor" },
      { text: "How satisfied are you with the learning experience? (1 = very dissatisfied, 5 = very satisfied)", type: "likert5", variableName: "satisfaction", note: "Likert · outcome variable" },
    ],
  },
  {
    keywords: ["technology", "app", "software", "digital", "mobile", "online"],
    suggestions: [
      { text: "How often do you use this technology? (1 = never, 5 = daily)", type: "likert5", variableName: "usage_frequency", note: "Likert · outcome variable" },
      { text: "How easy is this technology to use? (1 = very difficult, 5 = very easy)", type: "likert5", variableName: "ease_of_use", note: "Likert · usability measure" },
    ],
  },
];

const GENERIC: SuggestionTemplate["suggestions"] = [
  { text: "What is your age?", type: "numeric", variableName: "age", note: "Numeric · demographic control" },
  { text: "What is your gender?", type: "single_choice", variableName: "gender", note: "Category · demographic control" },
  { text: "Overall, how satisfied are you? (1 = very dissatisfied, 5 = very satisfied)", type: "likert5", variableName: "overall_satisfaction", note: "Likert · outcome variable" },
];

export function suggestQuestions(topic: string) {
  const lower = topic.toLowerCase();
  const matched = TEMPLATES.filter((t) => t.keywords.some((k) => lower.includes(k)));
  const suggestions = matched.length > 0 ? matched.flatMap((t) => t.suggestions) : GENERIC;
  return suggestions.slice(0, 4);
}
