import { z } from "zod";

export const createReferenceSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(1).max(500),
  authors: z.string().trim().min(1).max(500),
  year: z.number().int().min(1000).max(3000).optional(),
  journal: z.string().trim().max(300).optional(),
  doi: z.string().trim().max(200).optional(),
  url: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim()).optional(),
});

export const updateReferenceSchema = createReferenceSchema.partial().omit({ projectId: true });

export type CreateReferenceInput = z.infer<typeof createReferenceSchema>;
export type UpdateReferenceInput = z.infer<typeof updateReferenceSchema>;
