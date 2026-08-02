import type { Request, Response } from "express";
import { createProjectSchema, updateProjectSchema } from "../dto/project.dto.js";
import { projectService } from "../services/project.service.js";

export const projectController = {
  async list(_req: Request, res: Response) {
    const projects = await projectService.list();
    res.json({ data: projects });
  },

  async getById(req: Request, res: Response) {
    const project = await projectService.getById(Number(req.params.id));
    res.json({ data: project });
  },

  async create(req: Request, res: Response) {
    const input = createProjectSchema.parse(req.body);
    const project = await projectService.create(input);
    res.status(201).json({ data: project });
  },

  async update(req: Request, res: Response) {
    const input = updateProjectSchema.parse(req.body);
    const project = await projectService.update(Number(req.params.id), input);
    res.json({ data: project });
  },

  async remove(req: Request, res: Response) {
    await projectService.remove(Number(req.params.id));
    res.status(204).send();
  },
};
