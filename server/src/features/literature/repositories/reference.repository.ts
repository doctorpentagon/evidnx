import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/db/client.js";
import { references } from "../../../infrastructure/db/schema.js";
import type { CreateReferenceInput, UpdateReferenceInput } from "../dto/reference.dto.js";

export const referenceRepository = {
  async findAllByProject(projectId: number) {
    return db.select().from(references).where(eq(references.projectId, projectId)).all();
  },

  async findById(id: number) {
    return db.select().from(references).where(eq(references.id, id)).get();
  },

  async create(input: CreateReferenceInput) {
    const [created] = await db.insert(references).values(input).returning();
    return created;
  },

  async update(id: number, input: UpdateReferenceInput) {
    const [updated] = await db
      .update(references)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(references.id, id))
      .returning();
    return updated;
  },

  async remove(id: number) {
    await db.delete(references).where(eq(references.id, id));
  },

  async setPdfPath(id: number, pdfPath: string) {
    const [updated] = await db.update(references).set({ pdfPath }).where(eq(references.id, id)).returning();
    return updated;
  },
};
