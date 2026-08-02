import { api, type ApiEnvelope } from "@/lib/api";
import type { AnalysisRecord, AnalysisType, TestRecommendation } from "../types/analysis";

export const analysisService = {
  async recommend(input: { datasetId: number; groupingColumnId: number; outcomeColumnId: number }) {
    const { data } = await api.post<ApiEnvelope<TestRecommendation>>("/analyses/recommend", input);
    return data.data;
  },
  async run(input: { datasetId: number; type: AnalysisType; title: string; config: Record<string, unknown> }) {
    const { data } = await api.post<ApiEnvelope<AnalysisRecord>>("/analyses", input);
    return data.data;
  },
  async listByProject(projectId: number) {
    const { data } = await api.get<ApiEnvelope<AnalysisRecord[]>>(`/projects/${projectId}/analyses`);
    return data.data;
  },
};
