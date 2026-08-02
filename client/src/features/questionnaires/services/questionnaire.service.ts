import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  Question,
  QuestionnaireFull,
  QuestionnaireStatus,
  QuestionnaireSummary,
  PublicForm,
  ResponseStats,
  ShareInfo,
  Suggestion,
} from "../types/questionnaire";

export const questionnaireService = {
  async listByProject(projectId: number): Promise<QuestionnaireSummary[]> {
    const { data } = await api.get<ApiEnvelope<QuestionnaireSummary[]>>(`/projects/${projectId}/questionnaires`);
    return data.data;
  },

  async create(projectId: number, title: string, description?: string): Promise<QuestionnaireFull> {
    const { data } = await api.post<ApiEnvelope<QuestionnaireFull>>(`/projects/${projectId}/questionnaires`, {
      projectId,
      title,
      description,
    });
    return data.data;
  },

  async getById(id: number): Promise<QuestionnaireFull> {
    const { data } = await api.get<ApiEnvelope<QuestionnaireFull>>(`/questionnaires/${id}`);
    return data.data;
  },

  async update(
    id: number,
    patch: Partial<{ title: string; description: string; targetSampleSize: number; status: QuestionnaireStatus; questions: Question[] }>,
  ): Promise<QuestionnaireFull> {
    const { data } = await api.patch<ApiEnvelope<QuestionnaireFull>>(`/questionnaires/${id}`, patch);
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/questionnaires/${id}`);
  },

  async getSuggestions(id: number): Promise<Suggestion[]> {
    const { data } = await api.get<ApiEnvelope<Suggestion[]>>(`/questionnaires/${id}/suggestions`);
    return data.data;
  },

  async getShareInfo(id: number): Promise<ShareInfo> {
    const { data } = await api.get<ApiEnvelope<ShareInfo>>(`/questionnaires/${id}/share`);
    return data.data;
  },

  async getResponseStats(id: number): Promise<ResponseStats> {
    const { data } = await api.get<ApiEnvelope<ResponseStats>>(`/questionnaires/${id}/responses/stats`);
    return data.data;
  },

  async syncDataset(id: number) {
    const { data } = await api.post(`/questionnaires/${id}/sync-dataset`);
    return data.data;
  },

  async getPublicForm(slug: string): Promise<PublicForm> {
    const { data } = await api.get<ApiEnvelope<PublicForm>>(`/public/forms/${slug}`);
    return data.data;
  },

  async submitPublicResponse(slug: string, answers: Record<string, string | number | string[]>) {
    const { data } = await api.post(`/public/forms/${slug}/responses`, { answers });
    return data.data;
  },
};
