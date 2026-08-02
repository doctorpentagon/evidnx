import { asc, count, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db } from "../../../infrastructure/db/client.js";
import { questionnaires, questions, responseAnswers, responses } from "../../../infrastructure/db/schema.js";

const generateSlug = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export const questionnaireRepository = {
  async findAllByProject(projectId: number) {
    return db.select().from(questionnaires).where(eq(questionnaires.projectId, projectId)).all();
  },

  async findById(id: number) {
    return db.select().from(questionnaires).where(eq(questionnaires.id, id)).get();
  },

  async findBySlug(slug: string) {
    return db.select().from(questionnaires).where(eq(questionnaires.shareSlug, slug)).get();
  },

  async create(projectId: number, title: string, description?: string, targetSampleSize?: number) {
    const [created] = await db
      .insert(questionnaires)
      .values({ projectId, title, description, targetSampleSize, shareSlug: generateSlug() })
      .returning();
    return created;
  },

  async update(id: number, patch: Partial<{ title: string; description: string; targetSampleSize: number; status: "draft" | "published" }>) {
    const [updated] = await db
      .update(questionnaires)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(questionnaires.id, id))
      .returning();
    return updated;
  },

  async remove(id: number) {
    await db.delete(questionnaires).where(eq(questionnaires.id, id));
  },

  async getQuestions(questionnaireId: number) {
    return db.select().from(questions).where(eq(questions.questionnaireId, questionnaireId)).orderBy(asc(questions.order)).all();
  },

  async replaceQuestions(
    questionnaireId: number,
    items: { type: string; text: string; helpText?: string; options?: string[] | null; required: boolean; variableName: string }[],
  ) {
    await db.delete(questions).where(eq(questions.questionnaireId, questionnaireId));
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await db.insert(questions).values({
        questionnaireId,
        order: i,
        type: item.type as "single_choice" | "multiple_choice" | "likert5" | "text" | "numeric",
        text: item.text,
        helpText: item.helpText,
        options: item.options ?? null,
        required: item.required,
        variableName: item.variableName,
      });
    }
  },

  async countResponses(questionnaireId: number): Promise<number> {
    const [row] = await db.select({ value: count() }).from(responses).where(eq(responses.questionnaireId, questionnaireId));
    return row?.value ?? 0;
  },

  async createResponse(questionnaireId: number, answers: { questionId: number; value: string | number | string[] }[]) {
    const [response] = await db.insert(responses).values({ questionnaireId }).returning();
    for (const answer of answers) {
      await db.insert(responseAnswers).values({ responseId: response.id, questionId: answer.questionId, value: answer.value });
    }
    return response;
  },

  async getResponses(questionnaireId: number) {
    return db.select().from(responses).where(eq(responses.questionnaireId, questionnaireId)).all();
  },

  async getAnswersForResponse(responseId: number) {
    return db.select().from(responseAnswers).where(eq(responseAnswers.responseId, responseId)).all();
  },
};
