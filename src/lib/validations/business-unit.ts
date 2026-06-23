import { z } from "zod";

const iconIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(
    /^([a-z0-9-]+:[a-z0-9-]+|[a-z0-9-]+)$/,
    "Nombre de icono inválido"
  );

export const businessUnitSchema = z.object({
  name: z.string().min(2, "Nombre requerido (mín. 2 caracteres)"),
  description: z.string().max(500).optional().nullable(),
  icon: iconIdSchema.optional().nullable(),
});

export type BusinessUnitFormValues = z.infer<typeof businessUnitSchema>;

export const businessUnitUpdateSchema = businessUnitSchema;
