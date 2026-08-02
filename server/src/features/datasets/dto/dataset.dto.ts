import { z } from "zod";

export const createDatasetSchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  columns: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        measurementType: z.enum(["nominal", "ordinal", "metric"]).default("nominal"),
        valueType: z.enum(["string", "number"]).default("string"),
      }),
    )
    .default([]),
});

export const addColumnSchema = z.object({
  name: z.string().trim().min(1).max(200),
  measurementType: z.enum(["nominal", "ordinal", "metric"]).default("nominal"),
  valueType: z.enum(["string", "number"]).default("string"),
});

export const updateColumnSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  measurementType: z.enum(["nominal", "ordinal", "metric"]).optional(),
  valueType: z.enum(["string", "number"]).optional(),
  order: z.number().int().optional(),
});

export const addRowSchema = z.object({
  data: z.record(z.union([z.string(), z.number(), z.null()])),
});

export const updateRowSchema = addRowSchema;

export const recodeSchema = z.object({
  sourceColumnId: z.number().int().positive(),
  newColumnName: z.string().trim().min(1),
  mappings: z.array(
    z.union([
      z.object({ kind: z.literal("value"), from: z.union([z.string(), z.number()]), to: z.union([z.string(), z.number()]) }),
      z.object({ kind: z.literal("range"), fromValue: z.number(), toValue: z.number(), newValue: z.union([z.string(), z.number()]) }),
    ]),
  ),
});

export const createIndexSchema = z.object({
  sourceColumnIds: z.array(z.number().int().positive()).min(2),
  newColumnName: z.string().trim().min(1),
  method: z.enum(["sum", "mean"]),
  minValidValues: z.number().int().min(1).optional(),
});

export const handleMissingSchema = z.object({
  columnId: z.number().int().positive(),
  strategy: z.enum(["remove_row", "fill_mean", "fill_median", "fill_mode", "fill_value"]),
  fillValue: z.union([z.string(), z.number()]).optional(),
});

export const standardizeSchema = z.object({
  columnId: z.number().int().positive(),
});

export type CreateDatasetInput = z.infer<typeof createDatasetSchema>;
export type AddColumnInput = z.infer<typeof addColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type AddRowInput = z.infer<typeof addRowSchema>;
export type RecodeInput = z.infer<typeof recodeSchema>;
export type CreateIndexInput = z.infer<typeof createIndexSchema>;
export type HandleMissingInput = z.infer<typeof handleMissingSchema>;
