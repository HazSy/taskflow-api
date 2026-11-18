import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "El color debe tener formato hexadecimal, p. ej. #6366f1")
    .default("#6366f1"),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const listProjectsQuerySchema = z.object({
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  q: z.string().trim().max(120).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
