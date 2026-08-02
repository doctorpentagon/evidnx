import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ProjectDetailPage } from "@/features/dashboard/pages/ProjectDetailPage";
import { QuestionnairesListPage } from "@/features/questionnaires/pages/QuestionnairesListPage";
import { QuestionnaireBuilderPage } from "@/features/questionnaires/pages/QuestionnaireBuilderPage";
import { PublicFormPage } from "@/features/questionnaires/pages/PublicFormPage";
import { DataPage } from "@/features/data/pages/DataPage";
import { AnalysisPage } from "@/features/analysis/pages/AnalysisPage";
import { LiteraturePage } from "@/features/literature/pages/LiteraturePage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { LearnPage } from "@/features/learn/pages/LearnPage";
import { LandingPage } from "@/features/landing/pages/LandingPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/forms/:slug", element: <PublicFormPage /> },
  {
    path: "/app",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "projects/:id", element: <ProjectDetailPage /> },
      { path: "questionnaires", element: <QuestionnairesListPage /> },
      { path: "questionnaires/:id", element: <QuestionnaireBuilderPage /> },
      { path: "data", element: <DataPage /> },
      { path: "analysis", element: <AnalysisPage /> },
      { path: "literature", element: <LiteraturePage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "learn", element: <LearnPage /> },
    ],
  },
]);
