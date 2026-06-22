import { db } from "@/lib/db/helpers";
import { mapUser, mapBusinessUnit } from "@/lib/db/mappers";
import { Role } from "@/types/database";
import type { BusinessUnit } from "@/types/database";

export type OrgUserMembership = {
  membershipId: string;
  businessUnitId: string;
  businessUnitName: string;
  role: Role;
};

export type OrgUserRow = {
  id: string;
  name: string | null;
  email: string;
  memberships: OrgUserMembership[];
};

export async function listOrgUsers(manageableUnitIds: string[]): Promise<OrgUserRow[]> {
  if (manageableUnitIds.length === 0) return [];

  const { data, error } = await db()
    .from("memberships")
    .select("id, role, business_unit_id, users(id, name, email, created_at), business_units(id, name, slug)")
    .in("business_unit_id", manageableUnitIds);

  if (error) throw error;

  const byUser = new Map<string, OrgUserRow>();

  for (const row of data ?? []) {
    const userRow = Array.isArray(row.users) ? row.users[0] : row.users;
    const unitRow = Array.isArray(row.business_units)
      ? row.business_units[0]
      : row.business_units;

    if (!userRow?.id || !unitRow?.id) continue;

    const user = mapUser(userRow);
    const unit = mapBusinessUnit(unitRow);

    const existing: OrgUserRow = byUser.get(user.id) ?? {
      id: user.id,
      name: user.name,
      email: user.email,
      memberships: [],
    };

    existing.memberships.push({
      membershipId: row.id,
      businessUnitId: unit.id,
      businessUnitName: unit.name,
      role: row.role as Role,
    });

    byUser.set(user.id, existing);
  }

  return Array.from(byUser.values()).sort((a, b) =>
    a.email.localeCompare(b.email, "es")
  );
}

export async function getManageableBusinessUnits(
  manageableUnitIds: string[]
): Promise<BusinessUnit[]> {
  if (manageableUnitIds.length === 0) return [];

  const { data, error } = await db()
    .from("business_units")
    .select("*")
    .in("id", manageableUnitIds)
    .order("name");

  if (error) throw error;
  return (data ?? []).map(mapBusinessUnit);
}
