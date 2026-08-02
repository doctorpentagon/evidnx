import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/db/client.js";
import { reports, type ReportSection } from "../../../infrastructure/db/schema.js";

export const reportRepository = {
  async findAllByProject(projectId: number) {
    return db.select().from(reports).where(eq(reports.projectId, projectId)).all();
  },

  async findById(id: number) {
    return db.select().from(reports).where(eq(reports.id, id)).get();
  },

  async create(projectId: number, title: string, sections: ReportSection[]) {
    const [created] = await db.insert(reports).values({ projectId, title, sections }).returning();
    return created;
  },

  async update(id: number, patch: Partial<{ title: string; sections: ReportSection[] }>) {
    const [updated] = await db
      .update(reports)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(reports.id, id))
      .returning();
    return updated;
  },

  async remove(id: number) {
    await db.delete(reports).where(eq(reports.id, id));
  },
};
