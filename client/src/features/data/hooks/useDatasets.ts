import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { datasetService } from "../services/dataset.service";

export function useDatasets(projectId: number | null) {
  return useQuery({
    queryKey: ["datasets", "project", projectId],
    queryFn: () => datasetService.listByProject(projectId as number),
    enabled: projectId !== null,
  });
}

export function useCreateDataset(projectId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => datasetService.create(projectId as number, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["datasets", "project", projectId] }),
  });
}
