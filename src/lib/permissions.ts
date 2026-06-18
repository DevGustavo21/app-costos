import { Role } from "@/types/database";

const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 1,
  ACCOUNTANT: 2,
  ADMIN: 3,
  OWNER: 4,
};

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
