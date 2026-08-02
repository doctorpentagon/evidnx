import { AppError } from "../../../shared/errors.js";
import type { CreateReferenceInput, UpdateReferenceInput } from "../dto/reference.dto.js";
import { referenceRepository } from "../repositories/reference.repository.js";
import { formatCitation } from "./citation.service.js";

function withCitations<T extends { title: string; authors: string; year: number | null; journal: string | null; doi: string | null; url: string | null }>(ref: T) {
  return {
    ...ref,
    citations: {
      apa: formatCitation(ref, "apa"),
      mla: formatCitation(ref, "mla"),
      harvard: formatCitation(ref, "harvard"),
    },
  };
}

export const referenceService = {
  async listByProject(projectId: number) {
    const all = await referenceRepository.findAllByProject(projectId);
    return all.map(withCitations);
  },

  async getById(id: number) {
    const ref = await referenceRepository.findById(id);
    if (!ref) throw AppError.notFound("Reference", id);
    return withCitations(ref);
  },

  async create(input: CreateReferenceInput) {
    const created = await referenceRepository.create(input);
    return withCitations(created);
  },

  async update(id: number, input: UpdateReferenceInput) {
    const existing = await referenceRepository.findById(id);
    if (!existing) throw AppError.notFound("Reference", id);
    const updated = await referenceRepository.update(id, input);
    return withCitations(updated);
  },

  async remove(id: number) {
    const existing = await referenceRepository.findById(id);
    if (!existing) throw AppError.notFound("Reference", id);
    await referenceRepository.remove(id);
  },

  async attachPdf(id: number, pdfPath: string) {
    const existing = await referenceRepository.findById(id);
    if (!existing) throw AppError.notFound("Reference", id);
    const updated = await referenceRepository.setPdfPath(id, pdfPath);
    return withCitations(updated);
  },
};
