import { z } from "zod";
import { Role } from "@/types/database";
import { entityIdSchema } from "./ids";

const assignableRoleSchema = z.enum([Role.VIEWER, Role.ACCOUNTANT]);

export const membershipAssignmentSchema = z.object({
  businessUnitId: entityIdSchema,
  role: assignableRoleSchema,
});

export const unitAccessSchema = z.object({
  businessUnitId: entityIdSchema,
  enabled: z.boolean(),
  role: assignableRoleSchema,
});

export function getOrgUserFormSchema(isEdit: boolean) {
  return z
    .object({
      name: z.string().min(1, "El nombre es requerido").max(100),
      email: z.string().email("Correo inválido"),
      password: z.string(),
      unitAccess: z.array(unitAccessSchema),
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
      if (!data.unitAccess.some((unit) => unit.enabled)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["unitAccess"],
          message: "Seleccione al menos una unidad de negocio",
        });
      }
    });
}

export type OrgUserFormValues = z.infer<ReturnType<typeof getOrgUserFormSchema>>;
export type UnitAccessFormValue = z.infer<typeof unitAccessSchema>;

export function toMembershipAssignments(
  unitAccess: UnitAccessFormValue[]
): z.infer<typeof membershipAssignmentSchema>[] {
  return unitAccess
    .filter((unit) => unit.enabled)
    .map(({ businessUnitId, role }) => ({ businessUnitId, role }));
}

export const createOrgUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  memberships: z
    .array(membershipAssignmentSchema)
    .min(1, "Seleccione al menos una unidad de negocio"),
});

export const updateOrgUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  password: z
    .string()
    .refine((val) => val === "" || val.length >= 6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    })
    .optional(),
  memberships: z
    .array(membershipAssignmentSchema)
    .min(1, "Seleccione al menos una unidad de negocio"),
});

export type CreateOrgUserValues = z.infer<typeof createOrgUserSchema>;
export type UpdateOrgUserValues = z.infer<typeof updateOrgUserSchema>;
