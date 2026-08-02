import type { Request, Response } from "express";
import path from "node:path";
import fs from "node:fs";
import { AppError } from "../../../shared/errors.js";
import { createReferenceSchema, updateReferenceSchema } from "../dto/reference.dto.js";
import { referenceService } from "../services/reference.service.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "data", "papers");

export const referenceController = {
  async listByProject(req: Request, res: Response) {
    const data = await referenceService.listByProject(Number(req.params.projectId));
    res.json({ data });
  },

  async getById(req: Request, res: Response) {
    const data = await referenceService.getById(Number(req.params.id));
    res.json({ data });
  },

  async create(req: Request, res: Response) {
    const input = createReferenceSchema.parse(req.body);
    const data = await referenceService.create(input);
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response) {
    const input = updateReferenceSchema.parse(req.body);
    const data = await referenceService.update(Number(req.params.id), input);
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    await referenceService.remove(Number(req.params.id));
    res.status(204).send();
  },

  async uploadPdf(req: Request, res: Response) {
    if (!req.file) throw AppError.badRequest("No PDF was uploaded.");
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
    const data = await referenceService.attachPdf(Number(req.params.id), filename);
    res.json({ data });
  },

  async downloadPdf(req: Request, res: Response) {
    const reference = await referenceService.getById(Number(req.params.id));
    if (!reference.pdfPath) throw AppError.notFound("PDF for this reference");
    res.sendFile(path.join(UPLOAD_DIR, reference.pdfPath));
  },
};
