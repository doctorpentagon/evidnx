import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
};

/**
 * ownerId defaults to "local" everywhere since this build has no auth.
 * Kept as a real column (not omitted) so adding accounts later is a
 * migration, not a schema redesign.
 */
const OWNER_DEFAULT = "local";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull().default(OWNER_DEFAULT),
  name: text("name").notNull(),
  topic: text("topic"),
  projectType: text("project_type", {
    enum: ["research", "business", "personal"],
  })
    .notNull()
    .default("research"),
  status: text("status", { enum: ["active", "archived"] })
    .notNull()
    .default("active"),
  ...timestamps,
});

export const questionnaires = sqliteTable("questionnaires", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  shareSlug: text("share_slug").notNull().unique(),
  targetSampleSize: integer("target_sample_size"),
  ...timestamps,
});

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionnaireId: integer("questionnaire_id")
    .notNull()
    .references(() => questionnaires.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  type: text("type", {
    enum: ["single_choice", "multiple_choice", "likert5", "text", "numeric"],
  }).notNull(),
  text: text("text").notNull(),
  helpText: text("help_text"),
  options: text("options", { mode: "json" }).$type<string[] | null>(),
  required: integer("required", { mode: "boolean" }).notNull().default(true),
  variableName: text("variable_name").notNull(),
});

export const responses = sqliteTable("responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionnaireId: integer("questionnaire_id")
    .notNull()
    .references(() => questionnaires.id, { onDelete: "cascade" }),
  submittedAt: text("submitted_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const responseAnswers = sqliteTable("response_answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  responseId: integer("response_id")
    .notNull()
    .references(() => responses.id, { onDelete: "cascade" }),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  value: text("value", { mode: "json" }).$type<string | number | string[] | null>(),
});

export const datasets = sqliteTable("datasets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  source: text("source", { enum: ["manual", "import", "questionnaire"] })
    .notNull()
    .default("manual"),
  sourceQuestionnaireId: integer("source_questionnaire_id").references(
    () => questionnaires.id,
    { onDelete: "set null" },
  ),
  ...timestamps,
});

export const datasetColumns = sqliteTable("dataset_columns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => datasets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
  measurementType: text("measurement_type", {
    enum: ["nominal", "ordinal", "metric"],
  })
    .notNull()
    .default("nominal"),
  valueType: text("value_type", { enum: ["string", "number"] })
    .notNull()
    .default("string"),
});

/**
 * Row payload stored as JSON keyed by column id (as string) -> value.
 * Datasets are arbitrary-shape (any number/kind of columns per project),
 * so the row body is JSON while the relational backbone (dataset/columns)
 * stays fully structured - this is the resolution the engineering
 * playbook flagged as an inference (Part 0), applied here deliberately.
 */
export const datasetRows = sqliteTable("dataset_rows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => datasets.id, { onDelete: "cascade" }),
  rowIndex: integer("row_index").notNull(),
  data: text("data", { mode: "json" }).notNull().$type<Record<string, string | number | null>>(),
});

export const analyses = sqliteTable("analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => datasets.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: [
      "descriptive",
      "one_sample_t_test",
      "independent_t_test",
      "paired_t_test",
      "one_way_anova",
      "two_way_anova",
      "repeated_measures_anova",
      "chi_square",
      "mann_whitney",
      "wilcoxon",
      "kruskal_wallis",
      "correlation",
      "linear_regression",
      "logistic_regression",
      "ancova",
      "moderation",
      "mediation",
      "pca",
      "reliability",
      "cluster",
    ],
  }).notNull(),
  title: text("title").notNull(),
  config: text("config", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  results: text("results", { mode: "json" }).$type<Record<string, unknown> | null>(),
  assumptions: text("assumptions", { mode: "json" }).$type<Record<string, unknown> | null>(),
  interpretation: text("interpretation", { mode: "json" }).$type<Record<string, unknown> | null>(),
  status: text("status", { enum: ["draft", "completed", "failed"] })
    .notNull()
    .default("draft"),
  ...timestamps,
});

export const references = sqliteTable("references", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  year: integer("year"),
  journal: text("journal"),
  doi: text("doi"),
  url: text("url"),
  notes: text("notes"),
  pdfPath: text("pdf_path"),
  tags: text("tags", { mode: "json" }).$type<string[] | null>(),
  ...timestamps,
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sections: text("sections", { mode: "json" })
    .notNull()
    .$type<ReportSection[]>(),
  ...timestamps,
});

export type ReportSection =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "analysis"; analysisId: number; include: ("table" | "chart" | "interpretation")[] }
  | { type: "citation"; referenceId: number };

export { OWNER_DEFAULT };
