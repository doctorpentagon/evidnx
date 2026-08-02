import type { Request, Response } from "express";
import { createReportSchema, updateReportSchema } from "../dto/report.dto.js";
import { reportService } from "../services/report.service.js";

export const reportController = {
  async listByProject(req: Request, res: Response) {
    const data = await reportService.listByProject(Number(req.params.projectId));
    res.json({ data });
  },

  async getById(req: Request, res: Response) {
    const data = await reportService.getById(Number(req.params.id));
    res.json({ data });
  },

  async create(req: Request, res: Response) {
    const input = createReportSchema.parse(req.body);
    const data = await reportService.create(input);
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response) {
    const input = updateReportSchema.parse(req.body);
    const data = await reportService.update(Number(req.params.id), input);
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    await reportService.remove(Number(req.params.id));
    res.status(204).send();
  },

  async exportPdf(req: Request, res: Response) {
    const report = await reportService.getById(Number(req.params.id));
    const buffer = await reportService.exportPdf(Number(req.params.id));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${report.title}.pdf"`);
    res.send(buffer);
  },

  async exportDocx(req: Request, res: Response) {
    const report = await reportService.getById(Number(req.params.id));
    const buffer = await reportService.exportDocx(Number(req.params.id));
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${report.title}.docx"`);
    res.send(buffer);
  },
};
