import { z } from "zod";
import { MeasurementUnit, MEASUREMENT_UNITS } from "@/types/database";
import { entityIdSchema, optionalEntityIdSchema } from "./ids";

export const plantSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional().nullable(),
  measurementUnit: z.enum(MEASUREMENT_UNITS as [MeasurementUnit, ...MeasurementUnit[]], {
    message: "Seleccione una unidad de medida",
  }),
  basePrice: z.number().positive("El precio debe ser mayor a 0"),
  stock: z.number().min(0).nullable().optional(),
  isActive: z.boolean(),
  categoryId: z.string().min(1, "Seleccione la categoría de ingreso"),
});

export const plantFormSchema = plantSchema
  .extend({
    trackStock: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.trackStock && (data.stock == null || data.stock === undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "Ingrese el stock disponible",
        path: ["stock"],
      });
    }
  });

export type PlantFormValues = z.infer<typeof plantFormSchema>;

export function toPlantPayload(values: PlantFormValues) {
  const { trackStock, ...rest } = values;
  return plantSchema.parse({
    ...rest,
    stock: trackStock ? (rest.stock ?? 0) : null,
  });
}

export type PlantPayload = z.infer<typeof plantSchema>;

export const plantActionSchema = plantSchema.extend({
  businessUnitId: entityIdSchema,
  id: optionalEntityIdSchema,
});
