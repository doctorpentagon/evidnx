import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../../shared/asyncHandler.js";
import { referenceController } from "../controllers/reference.controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const referenceRouter = Router();
export const projectReferenceRouter = Router({ mergeParams: true });

projectReferenceRouter.get("/", asyncHandler(referenceController.listByProject));
projectReferenceRouter.post("/", asyncHandler(referenceController.create));

referenceRouter.get("/:id", asyncHandler(referenceController.getById));
referenceRouter.patch("/:id", asyncHandler(referenceController.update));
referenceRouter.delete("/:id", asyncHandler(referenceController.remove));
referenceRouter.post("/:id/pdf", upload.single("file"), asyncHandler(referenceController.uploadPdf));
referenceRouter.get("/:id/pdf", asyncHandler(referenceController.downloadPdf));
