import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { questionnaireService } from "../services/questionnaire.service";
import type { Question, QuestionnaireStatus } from "../types/questionnaire";

export function useQuestionnaire(id: number) {
  return useQuery({
    queryKey: ["questionnaires", id],
    queryFn: () => questionnaireService.getById(id),
  });
}

export function useUpdateQuestionnaire(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<{ title: string; description: string; targetSampleSize: number; status: QuestionnaireStatus; questions: Question[] }>) =>
      questionnaireService.update(id, patch),
    onSuccess: (data) => {
      queryClient.setQueryData(["questionnaires", id], data);
      queryClient.invalidateQueries({ queryKey: ["questionnaires", "project", data.projectId] });
    },
  });
}

export function useSuggestions(id: number) {
  return useQuery({
    queryKey: ["questionnaires", id, "suggestions"],
    queryFn: () => questionnaireService.getSuggestions(id),
  });
}

export function useShareInfo(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ["questionnaires", id, "share"],
    queryFn: () => questionnaireService.getShareInfo(id),
    enabled,
  });
}

export function useResponseStats(id: number) {
  return useQuery({
    queryKey: ["questionnaires", id, "responses", "stats"],
    queryFn: () => questionnaireService.getResponseStats(id),
    refetchInterval: 10_000,
  });
}
