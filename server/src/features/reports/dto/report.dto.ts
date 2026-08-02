import { z } from "zod";

export const reportSectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.union([z.literal(1), z.literal(2), z.literal(3)]), text: z.string() }),
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({
    type: z.literal("analysis"),
    analysisId: z.number().int().positive(),
    include: z.array(z.enum(["table", "chart", "interpretation"])),
  }),
  z.object({ type: z.literal("citation"), referenceId: z.number().int().positive() }),
]);

export const createReportSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  sections: z.array(reportSectionSchema).default([]),
});

export const updateReportSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  sections: z.array(reportSectionSchema).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReportSectionInput = z.infer<typeof reportSectionSchema>;
