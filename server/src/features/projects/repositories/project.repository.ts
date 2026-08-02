import { and, count, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/db/client.js";
import {
  analyses,
  datasets,
  OWNER_DEFAULT,
  projects,
  questionnaires,
  responses,
} from "../../../infrastructure/db/schema.js";
import type { CreateProjectInput, UpdateProjectInput } from "../dto/project.dto.js";

export const projectRepository = {
  async findAll() {
    return db.select().from(projects).where(eq(projects.ownerId, OWNER_DEFAULT)).all();
  },

  async findById(id: number) {
    return db.select().from(projects).where(eq(projects.id, id)).get();
  },

  async create(input: CreateProjectInput) {
    const [created] = await db
      .insert(projects)
      .values({ ...input, ownerId: OWNER_DEFAULT })
      .returning();
    return created;
  },

  async update(id: number, input: UpdateProjectInput) {
    const [updated] = await db
      .update(projects)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  },

  async remove(id: number) {
    await db.delete(projects).where(eq(projects.id, id));
  },

  /** Aggregate counts used by the dashboard's stat row + progress cards. */
  async getStats(projectId: number) {
    const [datasetCount] = await db
      .select({ value: count() })
      .from(datasets)
      .where(eq(datasets.projectId, projectId));

    const [analysisCount] = await db
      .select({ value: count() })
      .from(analyses)
      .where(and(eq(analyses.projectId, projectId), eq(analyses.status, "completed")));

    const projectQuestionnaires = await db
      .select({ id: questionnaires.id })
      .from(questionnaires)
      .where(eq(questionnaires.projectId, projectId));

    let responseCount = 0;
    for (const q of projectQuestionnaires) {
      const [row] = await db
        .select({ value: count() })
        .from(responses)
        .where(eq(responses.questionnaireId, q.id));
      responseCount += row?.value ?? 0;
    }

    return {
      datasetCount: datasetCount?.value ?? 0,
      analysisCount: analysisCount?.value ?? 0,
      responseCount,
    };
  },
};
