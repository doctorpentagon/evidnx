import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(200),
  topic: z.string().trim().max(500).optional(),
  projectType: z.enum(["research", "business", "personal"]).default("research"),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(["active", "archived"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
