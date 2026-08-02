import type { Request, Response } from "express";
import {
  createQuestionnaireSchema,
  submitResponseSchema,
  updateQuestionnaireSchema,
} from "../dto/questionnaire.dto.js";
import { questionnaireService } from "../services/questionnaire.service.js";

export const questionnaireController = {
  async listByProject(req: Request, res: Response) {
    const data = await questionnaireService.listByProject(Number(req.params.projectId));
    res.json({ data });
  },

  async getById(req: Request, res: Response) {
    const data = await questionnaireService.getFull(Number(req.params.id));
    res.json({ data });
  },

  async create(req: Request, res: Response) {
    const input = createQuestionnaireSchema.parse(req.body);
    const data = await questionnaireService.create(input.projectId, input.title, input.description, input.targetSampleSize);
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response) {
    const input = updateQuestionnaireSchema.parse(req.body);
    const data = await questionnaireService.update(Number(req.params.id), input);
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    await questionnaireService.remove(Number(req.params.id));
    res.status(204).send();
  },

  async getSuggestions(req: Request, res: Response) {
    const data = await questionnaireService.getSuggestions(Number(req.params.id));
    res.json({ data });
  },

  async getShareInfo(req: Request, res: Response) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = await questionnaireService.getShareInfo(Number(req.params.id), baseUrl);
    res.json({ data });
  },

  async getResponseStats(req: Request, res: Response) {
    const data = await questionnaireService.getResponseStats(Number(req.params.id));
    res.json({ data });
  },

  async syncDataset(req: Request, res: Response) {
    const data = await questionnaireService.syncResponsesToDataset(Number(req.params.id));
    res.json({ data });
  },

  // Public, unauthenticated endpoints for respondents
  async getPublicForm(req: Request, res: Response) {
    const data = await questionnaireService.getPublicBySlug(req.params.slug);
    res.json({ data });
  },

  async submitPublicResponse(req: Request, res: Response) {
    const input = submitResponseSchema.parse(req.body);
    const data = await questionnaireService.submitResponse(req.params.slug, input);
    res.status(201).json({ data });
  },
};
