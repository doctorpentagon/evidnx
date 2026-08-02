export type QuestionType = "single_choice" | "multiple_choice" | "likert5" | "text" | "numeric";
export type QuestionnaireStatus = "draft" | "published";

export interface Question {
  id?: number;
  type: QuestionType;
  text: string;
  helpText?: string;
  options?: string[];
  required: boolean;
  variableName: string;
}

export interface QuestionnaireSummary {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: QuestionnaireStatus;
  shareSlug: string;
  targetSampleSize: number | null;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireFull extends QuestionnaireSummary {
  questions: Question[];
}

export interface Suggestion {
  text: string;
  type: "numeric" | "likert5" | "single_choice";
  variableName: string;
  note: string;
}

export interface ShareInfo {
  url: string;
  qrCodeDataUrl: string;
  slug: string;
}

export interface ResponseStats {
  responseCount: number;
  targetSampleSize: number | null;
  completionPercent: number | null;
}

export interface PublicForm {
  id: number;
  title: string;
  description: string | null;
  questions: Required<Pick<Question, "id" | "type" | "text" | "helpText" | "options" | "required" | "variableName">>[];
}
