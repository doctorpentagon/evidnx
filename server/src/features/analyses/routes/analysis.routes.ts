import { Router } from "express";
import { asyncHandler } from "../../../shared/asyncHandler.js";
import { analysisController } from "../controllers/analysis.controller.js";

export const analysisRouter = Router();
export const projectAnalysisRouter = Router({ mergeParams: true });
export const datasetAnalysisRouter = Router({ mergeParams: true });

projectAnalysisRouter.get("/", asyncHandler(analysisController.listByProject));
datasetAnalysisRouter.get("/", asyncHandler(analysisController.listByDataset));

analysisRouter.post("/", asyncHandler(analysisController.run));
analysisRouter.post("/recommend", asyncHandler(analysisController.recommendTest));
analysisRouter.get("/:id", asyncHandler(analysisController.getById));
analysisRouter.delete("/:id", asyncHandler(analysisController.remove));
