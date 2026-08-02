import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/db/client.js";
import { analyses } from "../../../infrastructure/db/schema.js";
import type { analysisTypeSchema } from "../dto/analysis.dto.js";
import type { z } from "zod";

type AnalysisType = z.infer<typeof analysisTypeSchema>;

export const analysisRepository = {
  async findByProject(projectId: number) {
    return db.select().from(analyses).where(eq(analyses.projectId, projectId)).orderBy(desc(analyses.createdAt)).all();
  },

  async findByDataset(datasetId: number) {
    return db.select().from(analyses).where(eq(analyses.datasetId, datasetId)).orderBy(desc(analyses.createdAt)).all();
  },

  async findById(id: number) {
    return db.select().from(analyses).where(eq(analyses.id, id)).get();
  },

  async create(input: {
    projectId: number;
    datasetId: number;
    type: AnalysisType;
    title: string;
    config: Record<string, unknown>;
  }) {
    const [created] = await db
      .insert(analyses)
      .values({ ...input, status: "draft" })
      .returning();
    return created;
  },

  async complete(
    id: number,
    results: Record<string, unknown>,
    assumptions: Record<string, unknown> | null,
    interpretation: Record<string, unknown>,
  ) {
    const [updated] = await db
      .update(analyses)
      .set({ results, assumptions, interpretation, status: "completed", updatedAt: new Date().toISOString() })
      .where(eq(analyses.id, id))
      .returning();
    return updated;
  },

  async markFailed(id: number, error: string) {
    const [updated] = await db
      .update(analyses)
      .set({ results: { error }, status: "failed", updatedAt: new Date().toISOString() })
      .where(eq(analyses.id, id))
      .returning();
    return updated;
  },

  async remove(id: number) {
    await db.delete(analyses).where(eq(analyses.id, id));
  },
};
