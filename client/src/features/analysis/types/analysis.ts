export type AnalysisType = "independent_t_test" | "mann_whitney" | "one_way_anova" | "kruskal_wallis";

export interface TestRecommendation {
  recommendedTest: AnalysisType;
  variant?: "pooled" | "welch";
  parametric: boolean;
  reasoning: string;
  alternativesRuledOut: { test: string; reason: string }[];
  normalityByGroup: { group: string; pValue: number; normal: boolean }[];
  leveneP: number | null;
  equalVariances: boolean | null;
  outcomeVar: string;
  groupVar: string;
  groupCount: number;
}

export interface Interpretation {
  headline: string;
  columnExplanations: { label: string; explanation: string }[];
  narrative: Record<"plain" | "academic" | "detailed" | "executive_summary", string>;
  followUpQuestions: string[];
}

export interface AnalysisRecord {
  id: number;
  projectId: number;
  datasetId: number;
  type: AnalysisType;
  title: string;
  status: "draft" | "completed" | "failed";
  config: Record<string, unknown>;
  results: Record<string, unknown> | null;
  assumptions: Record<string, unknown> | null;
  interpretation: Interpretation | null;
  createdAt: string;
}
