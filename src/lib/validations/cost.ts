import { Currency, CostPaymentStatus, CostExpenseReportStatus } from "@/types/database";
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
    receiptUrls: z.array(z.string().url()).max(10, "Máximo 10 archivos"),
    paymentStatus: z.enum([
      CostPaymentStatus.PAID,
      CostPaymentStatus.ACCOUNTS_PAYABLE,
    ]),
    expenseReportStatus: z.enum([
      CostExpenseReportStatus.PENDING_REPORT,
      CostExpenseReportStatus.REPORTED_WITH_RECEIPT,
      CostExpenseReportStatus.REPORTED_WITHOUT_RECEIPT,
    ]),
    invoiceNumber: z.string().max(100).nullable().optional(),
  })
  .refine(
    (data) => data.currency !== Currency.NIO || (data.exchangeRate && data.exchangeRate > 0),
    { message: "La tasa de cambio es requerida para NIO", path: ["exchangeRate"] }
  )
  .refine(
    (data) =>
      data.expenseReportStatus !== CostExpenseReportStatus.REPORTED_WITH_RECEIPT ||
      Boolean(data.invoiceNumber?.trim()),
    { message: "Ingrese el número de factura", path: ["invoiceNumber"] }
  );

export type CostEntryFormValues = z.infer<typeof costEntrySchema>;

export const costActionSchema = costEntrySchema.extend({
  businessUnitId: entityIdSchema,
  id: optionalEntityIdSchema,
});
