import { cache } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "./auth";
import { db } from "@/lib/db/helpers";
import { mapBusinessUnit, mapMembership } from "@/lib/db/mappers";
import { slugify } from "@/lib/slug";
import { Role } from "@/types/database";
import type { BusinessUnit } from "@/types/database";

export { requireAuth, getAuthUser } from "./auth";

export function businessUnitSlug(unit: {
  slug?: string | null;
  name?: string | null;
  id: string;
}): string {
  return unit.slug ?? (slugify(unit.name ?? "") || unit.id);
}

async function findBusinessUnitBySlugOrId(
  slugOrId: string
): Promise<BusinessUnit | null> {
  const { data: byId, error: byIdError } = await db()
    .from("business_units")
    .select("*")
    .eq("id", slugOrId)
    .maybeSingle();

  if (byIdError) throw byIdError;
  if (byId) return mapBusinessUnit(byId);

  const { data: bySlug, error: bySlugError } = await db()
    .from("business_units")
    .select("*")
    .eq("slug", slugOrId)
    .maybeSingle();

  if (!bySlugError && bySlug) return mapBusinessUnit(bySlug);

  const slugColumnMissing = bySlugError?.message?.includes("slug");

  const { data: all, error: allError } = await db()
    .from("business_units")
    .select("*");

  if (allError) throw allError;

  const match = (all ?? []).find(
    (row) =>
      slugify(row.name ?? "") === slugOrId ||
      (!slugColumnMissing && row.slug === slugOrId)
  );

  return match ? mapBusinessUnit(match) : null;
}

export const resolveBusinessUnit = cache(findBusinessUnitBySlugOrId);

export const requireBusinessUnitAccess = cache(
  async (slugOrId: string, minRole: Role = Role.VIEWER) => {
    const { user } = await requireAuth();

    let businessUnit: BusinessUnit | null;
    try {
      businessUnit = await resolveBusinessUnit(slugOrId);
    } catch {
      redirect("/");
    }

    if (!businessUnit) redirect("/");

    const { data, error } = await db()
      .from("memberships")
      .select("*")
      .eq("user_id", user.id)
      .eq("business_unit_id", businessUnit.id)
      .maybeSingle();

    if (error || !data) redirect("/");

    const membership = mapMembership({ ...data, business_units: businessUnit });

    const roleOrder: Role[] = [Role.VIEWER, Role.ACCOUNTANT, Role.ADMIN, Role.OWNER];
    if (roleOrder.indexOf(membership.role) < roleOrder.indexOf(minRole)) {
      redirect(`/${businessUnitSlug(businessUnit)}`);
    }

    return { user, membership, businessUnit };
  }
);

export const getUserBusinessUnits = cache(async (userId: string) => {
  const { data, error } = await db()
    .from("memberships")
    .select("*, business_units(*)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? [])
    .map(mapMembership)
    .sort((a, b) =>
      (a.businessUnit?.name ?? "").localeCompare(b.businessUnit?.name ?? "")
    );
});
