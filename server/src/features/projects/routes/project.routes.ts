import { Router } from "express";
import { asyncHandler } from "../../../shared/asyncHandler.js";
import { projectController } from "../controllers/project.controller.js";

export const projectRouter = Router();

projectRouter.get("/", asyncHandler(projectController.list));
projectRouter.post("/", asyncHandler(projectController.create));
projectRouter.get("/:id", asyncHandler(projectController.getById));
projectRouter.patch("/:id", asyncHandler(projectController.update));
projectRouter.delete("/:id", asyncHandler(projectController.remove));
