import { Router } from "express";
import { asyncHandler } from "../../../shared/asyncHandler.js";
import { questionnaireController } from "../controllers/questionnaire.controller.js";

export const questionnaireRouter = Router();
export const projectQuestionnaireRouter = Router({ mergeParams: true });
export const publicFormRouter = Router();

projectQuestionnaireRouter.get("/", asyncHandler(questionnaireController.listByProject));
projectQuestionnaireRouter.post("/", asyncHandler(questionnaireController.create));

questionnaireRouter.get("/:id", asyncHandler(questionnaireController.getById));
questionnaireRouter.patch("/:id", asyncHandler(questionnaireController.update));
questionnaireRouter.delete("/:id", asyncHandler(questionnaireController.remove));
questionnaireRouter.get("/:id/suggestions", asyncHandler(questionnaireController.getSuggestions));
questionnaireRouter.get("/:id/share", asyncHandler(questionnaireController.getShareInfo));
questionnaireRouter.get("/:id/responses/stats", asyncHandler(questionnaireController.getResponseStats));
questionnaireRouter.post("/:id/sync-dataset", asyncHandler(questionnaireController.syncDataset));

// Public, unauthenticated - respondents never need to log in
publicFormRouter.get("/:slug", asyncHandler(questionnaireController.getPublicForm));
publicFormRouter.post("/:slug/responses", asyncHandler(questionnaireController.submitPublicResponse));
