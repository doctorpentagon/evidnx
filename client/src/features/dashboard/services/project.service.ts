import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type { CreateProjectInput, Project } from "../types/project";

export const projectService = {
  async list(): Promise<Project[]> {
    const { data } = await api.get<ApiEnvelope<Project[]>>("/projects");
    return data.data;
  },

  async create(input: CreateProjectInput): Promise<Project> {
    const { data } = await api.post<ApiEnvelope<Project>>("/projects", input);
    return data.data;
  },
};
