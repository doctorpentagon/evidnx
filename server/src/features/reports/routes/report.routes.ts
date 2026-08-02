import { Router } from "express";
import { asyncHandler } from "../../../shared/asyncHandler.js";
import { reportController } from "../controllers/report.controller.js";

export const reportRouter = Router();
export const projectReportRouter = Router({ mergeParams: true });

projectReportRouter.get("/", asyncHandler(reportController.listByProject));
projectReportRouter.post("/", asyncHandler(reportController.create));

reportRouter.get("/:id", asyncHandler(reportController.getById));
reportRouter.patch("/:id", asyncHandler(reportController.update));
reportRouter.delete("/:id", asyncHandler(reportController.remove));
reportRouter.get("/:id/export/pdf", asyncHandler(reportController.exportPdf));
reportRouter.get("/:id/export/docx", asyncHandler(reportController.exportDocx));
