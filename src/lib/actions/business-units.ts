"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { getUserBusinessUnits } from "@/lib/business-unit";
import { canCreateBusinessUnit } from "@/lib/permissions";
import { db, newId } from "@/lib/db/helpers";
import { mapBusinessUnit } from "@/lib/db/mappers";
import {
  businessUnitSchema,
  businessUnitUpdateSchema,
} from "@/lib/validations/business-unit";
import { ensureUniqueSlug } from "@/lib/slug";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { Role } from "@/types/database";

async function insertBusinessUnit(
  id: string,
  slug: string,
  data: { name: string; description?: string | null }
) {
  const payload = {
    id,
    slug,
    name: data.name,
    description: data.description ?? null,
    base_currency: "NIO" as const,
  };

  const { error } = await db().from("business_units").insert(payload);

  if (!error) return;

  if (error.message.includes("slug")) {
    const { error: fallbackError } = await db().from("business_units").insert({
      id,
      name: data.name,
      description: data.description ?? null,
      base_currency: "NIO",
    });
    if (fallbackError) throw new Error(fallbackError.message);
    return;
  }

  throw new Error(error.message);
}

export async function createBusinessUnit(input: unknown) {
  const { user } = await requireAuth();
  const memberships = await getUserBusinessUnits(user.id);

  if (!canCreateBusinessUnit(memberships)) {
    throw new Error("No tiene permiso para crear unidades de negocio");
  }

  const data = businessUnitSchema.parse(input);
  const id = newId();
  const slug = await ensureUniqueSlug(data.name);

  await insertBusinessUnit(id, slug, data);

  const { error: memberError } = await db().from("memberships").insert({
    user_id: user.id,
    business_unit_id: id,
    role: Role.OWNER,
  });

  if (memberError) throw new Error(memberError.message);

  await db().from("settings").insert({
    business_unit_id: id,
    key: "exchangeRate",
    value: "36.5",
  });

  revalidatePath("/");
  revalidatePath("/unidades/nueva");
  return { id, slug };
}

export async function updateBusinessUnit(businessUnitId: string, input: unknown) {
  const { businessUnit } = await requireBusinessUnitAccess(businessUnitId, Role.ADMIN);
  const data = businessUnitUpdateSchema.parse(input);
  const slug = await ensureUniqueSlug(data.name, businessUnit.id);
  const previousSlug = businessUnit.slug;

  const { data: updated, error } = await db()
    .from("business_units")
    .update({
      name: data.name,
      description: data.description ?? null,
      slug,
    })
    .eq("id", businessUnit.id)
    .select()
    .single();

  if (error || !updated) throw new Error(error?.message ?? "No se pudo actualizar");

  revalidatePath("/");
  revalidatePath(`/${previousSlug}`);
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/configuracion/unidad`);

  return {
    businessUnit: mapBusinessUnit(updated),
    slug,
    slugChanged: slug !== previousSlug,
  };
}
