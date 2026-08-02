import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analysisService } from "../services/analysis.service";

export function useAnalyses(projectId: number | null) {
  return useQuery({
    queryKey: ["analyses", "project", projectId],
    queryFn: () => analysisService.listByProject(projectId as number),
    enabled: projectId !== null,
  });
}

export function useRecommendAnalysis() {
  return useMutation({ mutationFn: analysisService.recommend });
}

export function useRunAnalysis(projectId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: analysisService.run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analyses", "project", projectId] }),
  });
}
