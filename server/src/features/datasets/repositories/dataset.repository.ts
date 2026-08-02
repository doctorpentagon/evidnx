import { asc, eq, max } from "drizzle-orm";
import { db } from "../../../infrastructure/db/client.js";
import { datasetColumns, datasetRows, datasets } from "../../../infrastructure/db/schema.js";

export const datasetRepository = {
  async findAllByProject(projectId: number) {
    return db.select().from(datasets).where(eq(datasets.projectId, projectId)).all();
  },

  async findById(id: number) {
    return db.select().from(datasets).where(eq(datasets.id, id)).get();
  },

  async create(
    projectId: number,
    name: string,
    source: "manual" | "import" | "questionnaire" = "manual",
    sourceQuestionnaireId?: number,
  ) {
    const [created] = await db.insert(datasets).values({ projectId, name, source, sourceQuestionnaireId }).returning();
    return created;
  },

  async rename(id: number, name: string) {
    const [updated] = await db
      .update(datasets)
      .set({ name, updatedAt: new Date().toISOString() })
      .where(eq(datasets.id, id))
      .returning();
    return updated;
  },

  async remove(id: number) {
    await db.delete(datasets).where(eq(datasets.id, id));
  },

  async getColumns(datasetId: number) {
    return db
      .select()
      .from(datasetColumns)
      .where(eq(datasetColumns.datasetId, datasetId))
      .orderBy(asc(datasetColumns.order))
      .all();
  },

  async getColumn(columnId: number) {
    return db.select().from(datasetColumns).where(eq(datasetColumns.id, columnId)).get();
  },

  async addColumn(datasetId: number, name: string, measurementType: "nominal" | "ordinal" | "metric", valueType: "string" | "number") {
    const [{ maxOrder }] = await db
      .select({ maxOrder: max(datasetColumns.order) })
      .from(datasetColumns)
      .where(eq(datasetColumns.datasetId, datasetId));
    const [created] = await db
      .insert(datasetColumns)
      .values({ datasetId, name, measurementType, valueType, order: (maxOrder ?? -1) + 1 })
      .returning();
    return created;
  },

  async updateColumn(columnId: number, patch: Partial<{ name: string; measurementType: "nominal" | "ordinal" | "metric"; valueType: "string" | "number"; order: number }>) {
    const [updated] = await db.update(datasetColumns).set(patch).where(eq(datasetColumns.id, columnId)).returning();
    return updated;
  },

  async removeColumn(columnId: number) {
    await db.delete(datasetColumns).where(eq(datasetColumns.id, columnId));
  },

  async getRows(datasetId: number) {
    return db
      .select()
      .from(datasetRows)
      .where(eq(datasetRows.datasetId, datasetId))
      .orderBy(asc(datasetRows.rowIndex))
      .all();
  },

  async addRow(datasetId: number, rowIndex: number, data: Record<string, string | number | null>) {
    const [created] = await db.insert(datasetRows).values({ datasetId, rowIndex, data }).returning();
    return created;
  },

  async bulkAddRows(datasetId: number, rows: Record<string, string | number | null>[]) {
    if (rows.length === 0) return;
    const values = rows.map((data, i) => ({ datasetId, rowIndex: i, data }));
    const chunkSize = 500;
    for (let i = 0; i < values.length; i += chunkSize) {
      await db.insert(datasetRows).values(values.slice(i, i + chunkSize));
    }
  },

  async updateRow(rowId: number, data: Record<string, string | number | null>) {
    const [updated] = await db.update(datasetRows).set({ data }).where(eq(datasetRows.id, rowId)).returning();
    return updated;
  },

  async removeRow(rowId: number) {
    await db.delete(datasetRows).where(eq(datasetRows.id, rowId));
  },

  async clearRows(datasetId: number) {
    await db.delete(datasetRows).where(eq(datasetRows.datasetId, datasetId));
  },
};
