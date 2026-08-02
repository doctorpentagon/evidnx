import type { Request, Response } from "express";
import { AppError } from "../../../shared/errors.js";
import {
  addColumnSchema,
  addRowSchema,
  createDatasetSchema,
  createIndexSchema,
  handleMissingSchema,
  recodeSchema,
  standardizeSchema,
  updateColumnSchema,
  updateRowSchema,
} from "../dto/dataset.dto.js";
import { datasetService } from "../services/dataset.service.js";

export const datasetController = {
  async listByProject(req: Request, res: Response) {
    const data = await datasetService.listByProject(Number(req.params.projectId));
    res.json({ data });
  },

  async getById(req: Request, res: Response) {
    const data = await datasetService.getFull(Number(req.params.id));
    res.json({ data });
  },

  async create(req: Request, res: Response) {
    const input = createDatasetSchema.parse(req.body);
    const data = await datasetService.create(input.projectId, input.name, input.columns);
    res.status(201).json({ data });
  },

  async rename(req: Request, res: Response) {
    const { name } = req.body as { name: string };
    const data = await datasetService.rename(Number(req.params.id), name);
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    await datasetService.remove(Number(req.params.id));
    res.status(204).send();
  },

  async importFile(req: Request, res: Response) {
    if (!req.file) throw AppError.badRequest("No file was uploaded.");
    const data = await datasetService.importFile(Number(req.params.id), req.file.buffer, req.file.originalname);
    res.json({ data });
  },

  async exportFile(req: Request, res: Response) {
    const format = (req.query.format === "csv" ? "csv" : "xlsx") as "csv" | "xlsx";
    const buffer = await datasetService.exportToBuffer(Number(req.params.id), format);
    const dataset = await datasetService.getFull(Number(req.params.id));
    res.setHeader("Content-Disposition", `attachment; filename="${dataset.name}.${format}"`);
    res.setHeader("Content-Type", format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  },

  async addColumn(req: Request, res: Response) {
    const input = addColumnSchema.parse(req.body);
    const data = await datasetService.addColumn(Number(req.params.id), input.name, input.measurementType, input.valueType);
    res.status(201).json({ data });
  },

  async removeColumn(req: Request, res: Response) {
    await datasetService.removeColumn(Number(req.params.columnId));
    res.status(204).send();
  },

  async updateColumn(req: Request, res: Response) {
    const input = updateColumnSchema.parse(req.body);
    const data = await datasetService.updateColumn(Number(req.params.columnId), input);
    res.json({ data });
  },

  async addRow(req: Request, res: Response) {
    const input = addRowSchema.parse(req.body);
    const data = await datasetService.addRow(Number(req.params.id), input.data);
    res.status(201).json({ data });
  },

  async updateRow(req: Request, res: Response) {
    const input = updateRowSchema.parse(req.body);
    const data = await datasetService.updateRow(Number(req.params.rowId), input.data);
    res.json({ data });
  },

  async removeRow(req: Request, res: Response) {
    await datasetService.removeRow(Number(req.params.rowId));
    res.status(204).send();
  },

  async getQuality(req: Request, res: Response) {
    const data = await datasetService.getQualityReport(Number(req.params.id));
    res.json({ data });
  },

  async handleMissing(req: Request, res: Response) {
    const input = handleMissingSchema.parse(req.body);
    await datasetService.handleMissing(Number(req.params.id), input);
    res.json({ data: await datasetService.getFull(Number(req.params.id)) });
  },

  async removeDuplicates(req: Request, res: Response) {
    const result = await datasetService.removeDuplicates(Number(req.params.id));
    res.json({ data: result });
  },

  async detectOutliers(req: Request, res: Response) {
    const columnId = Number(req.body.columnId);
    const result = await datasetService.detectOutliers(Number(req.params.id), columnId);
    res.json({ data: result });
  },

  async standardize(req: Request, res: Response) {
    const input = standardizeSchema.parse(req.body);
    const data = await datasetService.standardizeColumn(Number(req.params.id), input.columnId);
    res.status(201).json({ data });
  },

  async recode(req: Request, res: Response) {
    const input = recodeSchema.parse(req.body);
    const data = await datasetService.recode(Number(req.params.id), input);
    res.status(201).json({ data });
  },

  async createIndex(req: Request, res: Response) {
    const input = createIndexSchema.parse(req.body);
    const data = await datasetService.createIndex(Number(req.params.id), input);
    res.status(201).json({ data });
  },
};
