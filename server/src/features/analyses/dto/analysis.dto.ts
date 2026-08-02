import { z } from "zod";

export const analysisTypeSchema = z.enum([
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
]);

/** Config shape varies by analysis type; validated more precisely at the
 * service layer once we know which type we're running (the columnIds
 * reference dataset_columns.id). */
export const createAnalysisSchema = z.object({
  datasetId: z.number().int().positive(),
  type: analysisTypeSchema,
  title: z.string().trim().min(1).max(200),
  config: z.record(z.unknown()),
});

export const recommendTestSchema = z.object({
  datasetId: z.number().int().positive(),
  groupingColumnId: z.number().int().positive(),
  outcomeColumnId: z.number().int().positive(),
  paired: z.boolean().optional(),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
export type RecommendTestInput = z.infer<typeof recommendTestSchema>;
