import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../services/project.service";
import type { CreateProjectInput } from "../types/project";

const PROJECTS_KEY = ["projects"] as const;

export function useProjects() {
  return useQuery({ queryKey: PROJECTS_KEY, queryFn: projectService.list });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}
