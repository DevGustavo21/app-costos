import { Role } from "@/types/database";

const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 1,
  ACCOUNTANT: 2,
  ADMIN: 3,
  OWNER: 4,
};

/** Roles que el administrador puede asignar al invitar usuarios. */
export const ASSIGNABLE_MEMBER_ROLES = [Role.VIEWER, Role.ACCOUNTANT] as const;
export type AssignableMemberRole = (typeof ASSIGNABLE_MEMBER_ROLES)[number];

export function hasMinRole(userRole: Role, required: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function canManageConfig(role: Role): boolean {
  return hasMinRole(role, Role.ADMIN);
}

export function canWriteEntries(role: Role): boolean {
  return hasMinRole(role, Role.ACCOUNTANT);
}

export function canManageMembers(role: Role): boolean {
  return hasMinRole(role, Role.OWNER);
}

/** Puede gestionar usuarios de la organización (invitar, editar accesos). */
export function canManageOrgUsers(role: Role): boolean {
  return hasMinRole(role, Role.ADMIN);
}

export function isViewerRole(role: Role): boolean {
  return role === Role.VIEWER;
}

/** Crear una nueva unidad de negocio (no disponible para Lector). */
export function canCreateBusinessUnit(memberships: { role: Role }[]): boolean {
  if (memberships.length === 0) return true;
  return memberships.some((m) => hasMinRole(m.role, Role.ACCOUNTANT));
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case Role.VIEWER:
      return "Lector";
    case Role.ACCOUNTANT:
      return "Editor";
    case Role.ADMIN:
      return "Administrador";
    case Role.OWNER:
      return "Propietario";
    default:
      return role;
  }
}

export function getAssignableRoleDescription(role: AssignableMemberRole): string {
  switch (role) {
    case Role.VIEWER:
      return "Consulta el panel principal y las estadísticas de cada unidad. No puede registrar ingresos, costos ni crear unidades de negocio.";
    case Role.ACCOUNTANT:
      return "Todo lo del Lector, más crear, editar y eliminar registros de ingresos y costos. No puede modificar categorías, productos ni configuración de la unidad.";
    default:
      return "";
  }
}
