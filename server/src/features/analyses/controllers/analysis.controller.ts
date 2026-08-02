import type { Request, Response } from "express";
import { createAnalysisSchema, recommendTestSchema } from "../dto/analysis.dto.js";
import { analysisService } from "../services/analysis.service.js";

export const analysisController = {
  async listByProject(req: Request, res: Response) {
    const data = await analysisService.listByProject(Number(req.params.projectId));
    res.json({ data });
  },

  async listByDataset(req: Request, res: Response) {
    const data = await analysisService.listByDataset(Number(req.params.datasetId));
    res.json({ data });
  },

  async getById(req: Request, res: Response) {
    const data = await analysisService.getById(Number(req.params.id));
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    await analysisService.remove(Number(req.params.id));
    res.status(204).send();
  },

  async recommendTest(req: Request, res: Response) {
    const input = recommendTestSchema.parse(req.body);
    const data = await analysisService.recommendTest(input);
    res.json({ data });
  },

  async run(req: Request, res: Response) {
    const input = createAnalysisSchema.parse(req.body);
    const data = await analysisService.run(input);
    res.status(201).json({ data });
  },
};
