import { z } from "zod";

export const businessUnitSchema = z.object({
  name: z.string().min(2, "Nombre requerido (mín. 2 caracteres)"),
  description: z.string().max(500).optional().nullable(),
});

export type BusinessUnitFormValues = z.infer<typeof businessUnitSchema>;

export const businessUnitUpdateSchema = businessUnitSchema;
