import { z } from "zod";

export const questionTypeSchema = z.enum(["single_choice", "multiple_choice", "likert5", "text", "numeric"]);

export const questionInputSchema = z.object({
  id: z.number().int().positive().optional(),
  type: questionTypeSchema,
  text: z.string().trim().min(1),
  helpText: z.string().trim().optional(),
  options: z.array(z.string().trim().min(1)).optional(),
  required: z.boolean().default(true),
  variableName: z.string().trim().min(1),
});

export const createQuestionnaireSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  targetSampleSize: z.number().int().positive().optional(),
});

export const updateQuestionnaireSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  targetSampleSize: z.number().int().positive().optional(),
  status: z.enum(["draft", "published"]).optional(),
  questions: z.array(questionInputSchema).optional(),
});

export const submitResponseSchema = z.object({
  answers: z.record(z.union([z.string(), z.number(), z.array(z.string())])),
});

export type CreateQuestionnaireInput = z.infer<typeof createQuestionnaireSchema>;
export type UpdateQuestionnaireInput = z.infer<typeof updateQuestionnaireSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
