import { CategoryType } from "@/types/database";
import { z } from "zod";
import { entityIdSchema, optionalEntityIdSchema } from "./ids";

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean(),
  isPlantCategory: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const categoryActionSchema = categorySchema.extend({
  businessUnitId: entityIdSchema,
  type: z.enum([CategoryType.COST, CategoryType.INCOME]),
  id: optionalEntityIdSchema,
});
