import { Currency } from "@/types/database";
import { z } from "zod";
import { entityIdSchema, optionalEntityIdSchema } from "./ids";

export const costEntrySchema = z
  .object({
    date: z.date(),
    categoryId: z.string().min(1, "Seleccione una categoría"),
    description: z.string().min(1, "La descripción es requerida").max(1000),
    currency: z.enum([Currency.USD, Currency.NIO]),
    amount: z.number().positive("El monto debe ser mayor a 0"),
    exchangeRate: z.number().positive().nullable().optional(),
    receiptUrl: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  })
  .refine(
    (data) => data.currency !== Currency.NIO || (data.exchangeRate && data.exchangeRate > 0),
    { message: "La tasa de cambio es requerida para NIO", path: ["exchangeRate"] }
  );

export type CostEntryFormValues = z.infer<typeof costEntrySchema>;

export const costActionSchema = costEntrySchema.extend({
  businessUnitId: entityIdSchema,
  id: optionalEntityIdSchema,
});
