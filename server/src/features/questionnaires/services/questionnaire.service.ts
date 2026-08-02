import QRCode from "qrcode";
import { AppError } from "../../../shared/errors.js";
import { datasetRepository } from "../../datasets/repositories/dataset.repository.js";
import type { QuestionInput, SubmitResponseInput } from "../dto/questionnaire.dto.js";
import { questionnaireRepository } from "../repositories/questionnaire.repository.js";
import { suggestQuestions } from "./suggestion.service.js";

export const questionnaireService = {
  async listByProject(projectId: number) {
    const all = await questionnaireRepository.findAllByProject(projectId);
    return Promise.all(
      all.map(async (q) => ({ ...q, responseCount: await questionnaireRepository.countResponses(q.id) })),
    );
  },

  async getFull(id: number) {
    const questionnaire = await questionnaireRepository.findById(id);
    if (!questionnaire) throw AppError.notFound("Questionnaire", id);
    const questions = await questionnaireRepository.getQuestions(id);
    const responseCount = await questionnaireRepository.countResponses(id);
    return { ...questionnaire, questions, responseCount };
  },

  async getPublicBySlug(slug: string) {
    const questionnaire = await questionnaireRepository.findBySlug(slug);
    if (!questionnaire || questionnaire.status !== "published") {
      throw AppError.notFound("Questionnaire");
    }
    const questions = await questionnaireRepository.getQuestions(questionnaire.id);
    return { id: questionnaire.id, title: questionnaire.title, description: questionnaire.description, questions };
  },

  async create(projectId: number, title: string, description?: string, targetSampleSize?: number) {
    return questionnaireRepository.create(projectId, title, description, targetSampleSize);
  },

  async update(id: number, patch: { title?: string; description?: string; targetSampleSize?: number; status?: "draft" | "published"; questions?: QuestionInput[] }) {
    const existing = await questionnaireRepository.findById(id);
    if (!existing) throw AppError.notFound("Questionnaire", id);

    const { questions, ...rest } = patch;
    if (Object.keys(rest).length > 0) {
      await questionnaireRepository.update(id, rest);
    }
    if (questions) {
      await questionnaireRepository.replaceQuestions(id, questions);
    }
    return this.getFull(id);
  },

  async remove(id: number) {
    const existing = await questionnaireRepository.findById(id);
    if (!existing) throw AppError.notFound("Questionnaire", id);
    await questionnaireRepository.remove(id);
  },

  async getSuggestions(id: number) {
    const questionnaire = await questionnaireRepository.findById(id);
    if (!questionnaire) throw AppError.notFound("Questionnaire", id);
    return suggestQuestions(`${questionnaire.title} ${questionnaire.description ?? ""}`);
  },

  async getShareInfo(id: number, publicBaseUrl: string) {
    const questionnaire = await questionnaireRepository.findById(id);
    if (!questionnaire) throw AppError.notFound("Questionnaire", id);
    const url = `${publicBaseUrl}/forms/${questionnaire.shareSlug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
    return { url, qrCodeDataUrl, slug: questionnaire.shareSlug };
  },

  async submitResponse(slug: string, input: SubmitResponseInput) {
    const questionnaire = await questionnaireRepository.findBySlug(slug);
    if (!questionnaire || questionnaire.status !== "published") throw AppError.notFound("Questionnaire");
    const questions = await questionnaireRepository.getQuestions(questionnaire.id);

    for (const q of questions) {
      if (q.required && (input.answers[String(q.id)] === undefined || input.answers[String(q.id)] === "")) {
        throw AppError.validation(`"${q.text}" is required.`);
      }
    }

    const answers = questions
      .filter((q) => input.answers[String(q.id)] !== undefined)
      .map((q) => ({ questionId: q.id, value: input.answers[String(q.id)] }));

    await questionnaireRepository.createResponse(questionnaire.id, answers);

    // Keep the linked dataset in sync so Analysis always reflects the latest responses.
    await this.syncResponsesToDataset(questionnaire.id);

    return { success: true };
  },

  async getResponseStats(id: number) {
    const questionnaire = await questionnaireRepository.findById(id);
    if (!questionnaire) throw AppError.notFound("Questionnaire", id);
    const responseCount = await questionnaireRepository.countResponses(id);
    const target = questionnaire.targetSampleSize ?? null;
    return {
      responseCount,
      targetSampleSize: target,
      completionPercent: target ? Math.min(100, (responseCount / target) * 100) : null,
    };
  },

  /** Materializes questionnaire responses into a Dataset (one column per
   * question, keyed by variableName) so the Analysis suite can run directly
   * against collected survey data, not just imported/manual data. */
  async syncResponsesToDataset(questionnaireId: number) {
    const questionnaire = await questionnaireRepository.findById(questionnaireId);
    if (!questionnaire) throw AppError.notFound("Questionnaire", questionnaireId);
    const questions = await questionnaireRepository.getQuestions(questionnaireId);
    const responses = await questionnaireRepository.getResponses(questionnaireId);

    const existingDatasets = await datasetRepository.findAllByProject(questionnaire.projectId);
    let dataset = existingDatasets.find((d) => d.sourceQuestionnaireId === questionnaireId);
    if (!dataset) {
      dataset = await datasetRepository.create(
        questionnaire.projectId,
        `${questionnaire.title} — responses`,
        "questionnaire",
        questionnaireId,
      );
    }

    const existingColumns = await datasetRepository.getColumns(dataset.id);
    for (const col of existingColumns) await datasetRepository.removeColumn(col.id);
    await datasetRepository.clearRows(dataset.id);

    const columnIdByQuestionId = new Map<number, number>();
    for (const q of questions) {
      const measurementType = q.type === "numeric" ? "metric" : q.type === "likert5" ? "ordinal" : "nominal";
      const valueType = q.type === "numeric" || q.type === "likert5" ? "number" : "string";
      const col = await datasetRepository.addColumn(dataset.id, q.variableName, measurementType, valueType);
      columnIdByQuestionId.set(q.id, col.id);
    }

    const rows: Record<string, string | number | null>[] = [];
    for (const response of responses) {
      const answers = await questionnaireRepository.getAnswersForResponse(response.id);
      const row: Record<string, string | number | null> = {};
      for (const answer of answers) {
        const colId = columnIdByQuestionId.get(answer.questionId);
        if (colId === undefined) continue;
        const value = answer.value;
        row[String(colId)] = Array.isArray(value) ? value.join("; ") : value;
      }
      rows.push(row);
    }
    await datasetRepository.bulkAddRows(dataset.id, rows);

    return dataset;
  },
};
