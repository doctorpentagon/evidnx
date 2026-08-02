import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { questionnaireService } from "../services/questionnaire.service";

export function useQuestionnaires(projectId: number | null) {
  return useQuery({
    queryKey: ["questionnaires", "project", projectId],
    queryFn: () => questionnaireService.listByProject(projectId as number),
    enabled: projectId !== null,
  });
}

export function useCreateQuestionnaire(projectId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description?: string }) =>
      questionnaireService.create(projectId as number, input.title, input.description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questionnaires", "project", projectId] }),
  });
}
