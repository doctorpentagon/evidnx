export type ProjectType = "research" | "business" | "personal";
export type ProjectStatus = "active" | "archived";

export interface ProjectStats {
  datasetCount: number;
  analysisCount: number;
  responseCount: number;
}

export interface Project {
  id: number;
  ownerId: string;
  name: string;
  topic: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  stats: ProjectStats;
}

export interface CreateProjectInput {
  name: string;
  topic?: string;
  projectType: ProjectType;
}
