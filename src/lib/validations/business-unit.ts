import { z } from "zod";
import { MeasurementUnit, MEASUREMENT_UNITS } from "@/types/database";
import { usesVolumePricing } from "@/lib/measurement-unit";

export const businessUnitSchema = z
  .object({
    name: z.string().min(2, "Nombre requerido (mín. 2 caracteres)"),
    description: z.string().max(500).optional().nullable(),
    measurementUnit: z.enum(MEASUREMENT_UNITS as [MeasurementUnit, ...MeasurementUnit[]], {
      message: "Seleccione una unidad de medida",
    }),
    basePricePerUnit: z
      .number()
      .positive("El precio base debe ser mayor a 0")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      usesVolumePricing(data.measurementUnit) &&
      (data.basePricePerUnit == null || data.basePricePerUnit <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indique el precio base por litro o galón",
        path: ["basePricePerUnit"],
      });
    }
  });

export type BusinessUnitFormValues = z.infer<typeof businessUnitSchema>;

export const businessUnitUpdateSchema = businessUnitSchema;
