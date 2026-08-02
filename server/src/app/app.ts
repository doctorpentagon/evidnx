import cors from "cors";
import express from "express";
import { env } from "../config/env.js";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler.js";
import { projectRouter } from "../features/projects/routes/project.routes.js";
import { datasetRouter, projectDatasetRouter } from "../features/datasets/routes/dataset.routes.js";
import { questionnaireRouter, projectQuestionnaireRouter, publicFormRouter } from "../features/questionnaires/routes/questionnaire.routes.js";
import { analysisRouter, projectAnalysisRouter, datasetAnalysisRouter } from "../features/analyses/routes/analysis.routes.js";
import { referenceRouter, projectReferenceRouter } from "../features/literature/routes/reference.routes.js";
import { reportRouter, projectReportRouter } from "../features/reports/routes/report.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Nested, project-scoped listing/creation routes
  app.use("/api/projects/:projectId/datasets", projectDatasetRouter);
  app.use("/api/projects/:projectId/questionnaires", projectQuestionnaireRouter);
  app.use("/api/projects/:projectId/analyses", projectAnalysisRouter);
  app.use("/api/projects/:projectId/references", projectReferenceRouter);
  app.use("/api/projects/:projectId/reports", projectReportRouter);
  app.use("/api/datasets/:datasetId/analyses", datasetAnalysisRouter);

  // Flat, resource-id-scoped routes
  app.use("/api/projects", projectRouter);
  app.use("/api/datasets", datasetRouter);
  app.use("/api/questionnaires", questionnaireRouter);
  app.use("/api/analyses", analysisRouter);
  app.use("/api/references", referenceRouter);
  app.use("/api/reports", reportRouter);

  // Public, unauthenticated routes for questionnaire respondents
  app.use("/api/public/forms", publicFormRouter);

  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}
