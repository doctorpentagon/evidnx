import { AppError } from "../../../shared/errors.js";
import type { CreateProjectInput, UpdateProjectInput } from "../dto/project.dto.js";
import { projectRepository } from "../repositories/project.repository.js";

export const projectService = {
  async list() {
    const all = await projectRepository.findAll();
    const withStats = await Promise.all(
      all.map(async (project) => ({
        ...project,
        stats: await projectRepository.getStats(project.id),
      })),
    );
    return withStats;
  },

  async getById(id: number) {
    const project = await projectRepository.findById(id);
    if (!project) throw AppError.notFound("Project", id);
    const stats = await projectRepository.getStats(id);
    return { ...project, stats };
  },

  async create(input: CreateProjectInput) {
    return projectRepository.create(input);
  },

  async update(id: number, input: UpdateProjectInput) {
    const existing = await projectRepository.findById(id);
    if (!existing) throw AppError.notFound("Project", id);
    return projectRepository.update(id, input);
  },

  async remove(id: number) {
    const existing = await projectRepository.findById(id);
    if (!existing) throw AppError.notFound("Project", id);
    await projectRepository.remove(id);
  },
};
