import { z } from "zod";
import { entityIdSchema, optionalEntityIdSchema } from "./ids";

export const plantSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional().nullable(),
  basePrice: z.number().positive("El precio debe ser mayor a 0"),
  stock: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean(),
});

export type PlantFormValues = z.infer<typeof plantSchema>;

export const plantActionSchema = plantSchema.extend({
  businessUnitId: entityIdSchema,
  id: optionalEntityIdSchema,
});
