import { z } from "zod";
import { Role } from "@/types/database";
import { entityIdSchema } from "./ids";

const assignableRoleSchema = z.enum([Role.VIEWER, Role.ACCOUNTANT]);

export function getOrgUserFormSchema(isEdit: boolean) {
  return z
    .object({
      name: z.string().min(1, "El nombre es requerido").max(100),
      email: z.string().email("Correo inválido"),
      password: z.string(),
      businessUnitIds: z
        .array(entityIdSchema)
        .min(1, "Seleccione al menos una unidad de negocio"),
      role: assignableRoleSchema,
    })
    .superRefine((data, ctx) => {
      if (!isEdit && data.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "La contraseña debe tener al menos 6 caracteres",
        });
      }
      if (isEdit && data.password.length > 0 && data.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "La contraseña debe tener al menos 6 caracteres",
        });
      }
    });
}

export type OrgUserFormValues = z.infer<ReturnType<typeof getOrgUserFormSchema>>;

export const createOrgUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  businessUnitIds: z
    .array(entityIdSchema)
    .min(1, "Seleccione al menos una unidad de negocio"),
  role: assignableRoleSchema,
});

export const updateOrgUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  password: z
    .string()
    .refine((val) => val === "" || val.length >= 6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    })
    .optional(),
  businessUnitIds: z
    .array(entityIdSchema)
    .min(1, "Seleccione al menos una unidad de negocio"),
  role: assignableRoleSchema,
});

export type CreateOrgUserValues = z.infer<typeof createOrgUserSchema>;
export type UpdateOrgUserValues = z.infer<typeof updateOrgUserSchema>;
