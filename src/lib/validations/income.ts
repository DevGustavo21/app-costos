import { Currency } from "@/types/database";
import { z } from "zod";
import { entityIdSchema, optionalEntityIdSchema } from "./ids";

export const incomeLineSchema = z.object({
  plantId: z.string().min(1, "Seleccione un producto"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().positive().nullable().optional(),
  description: z.string().max(500).optional().nullable(),
});

export const incomeEntrySchema = z
  .object({
    date: z.date(),
    categoryId: z.string().min(1, "Seleccione una categoría"),
    description: z.string().max(1000).optional().nullable(),
    currency: z.enum([Currency.USD, Currency.NIO]),
    amount: z.number().positive("El monto debe ser mayor a 0").optional(),
    exchangeRate: z.number().positive().nullable().optional(),
    isPlantCategory: z.boolean(),
    isVolumeSale: z.boolean().optional(),
    saleQuantity: z.number().positive("La cantidad debe ser mayor a 0").optional(),
    unitPrice: z.number().positive("El precio unitario debe ser mayor a 0").optional(),
    lines: z.array(incomeLineSchema).optional(),
  })
  .refine(
    (data) => data.currency !== Currency.NIO || (data.exchangeRate && data.exchangeRate > 0),
    { message: "La tasa de cambio es requerida para NIO", path: ["exchangeRate"] }
  )
  .refine(
    (data) => {
      if (data.isPlantCategory) {
        return data.lines && data.lines.length > 0;
      }
      if (data.isVolumeSale) {
        return (
          data.saleQuantity != null &&
          data.saleQuantity > 0 &&
          data.unitPrice != null &&
          data.unitPrice > 0
        );
      }
      return data.amount !== undefined && data.amount > 0;
    },
    {
      message: "Complete la cantidad o el monto del ingreso",
      path: ["saleQuantity"],
    }
  );

export type IncomeEntryFormValues = z.infer<typeof incomeEntrySchema>;
export type IncomeLineFormValues = z.infer<typeof incomeLineSchema>;

export const incomeActionSchema = incomeEntrySchema.extend({
  businessUnitId: entityIdSchema,
  id: optionalEntityIdSchema,
});
