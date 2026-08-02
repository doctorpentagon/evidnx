import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../../shared/asyncHandler.js";
import { datasetController } from "../controllers/dataset.controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const datasetRouter = Router();

// Nested under /projects/:projectId/datasets for listing + creation
export const projectDatasetRouter = Router({ mergeParams: true });
projectDatasetRouter.get("/", asyncHandler(datasetController.listByProject));
projectDatasetRouter.post("/", asyncHandler(datasetController.create));

// Flat /datasets/:id routes for everything else
datasetRouter.get("/:id", asyncHandler(datasetController.getById));
datasetRouter.patch("/:id", asyncHandler(datasetController.rename));
datasetRouter.delete("/:id", asyncHandler(datasetController.remove));
datasetRouter.post("/:id/import", upload.single("file"), asyncHandler(datasetController.importFile));
datasetRouter.get("/:id/export", asyncHandler(datasetController.exportFile));
datasetRouter.get("/:id/quality", asyncHandler(datasetController.getQuality));

datasetRouter.post("/:id/columns", asyncHandler(datasetController.addColumn));
datasetRouter.patch("/columns/:columnId", asyncHandler(datasetController.updateColumn));
datasetRouter.delete("/columns/:columnId", asyncHandler(datasetController.removeColumn));

datasetRouter.post("/:id/rows", asyncHandler(datasetController.addRow));
datasetRouter.patch("/rows/:rowId", asyncHandler(datasetController.updateRow));
datasetRouter.delete("/rows/:rowId", asyncHandler(datasetController.removeRow));

datasetRouter.post("/:id/clean/handle-missing", asyncHandler(datasetController.handleMissing));
datasetRouter.post("/:id/clean/remove-duplicates", asyncHandler(datasetController.removeDuplicates));
datasetRouter.post("/:id/clean/detect-outliers", asyncHandler(datasetController.detectOutliers));
datasetRouter.post("/:id/clean/standardize", asyncHandler(datasetController.standardize));

datasetRouter.post("/:id/transform/recode", asyncHandler(datasetController.recode));
datasetRouter.post("/:id/transform/create-index", asyncHandler(datasetController.createIndex));
