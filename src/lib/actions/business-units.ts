"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db, newId } from "@/lib/db/helpers";
import { mapBusinessUnit } from "@/lib/db/mappers";
import {
  businessUnitSchema,
  businessUnitUpdateSchema,
} from "@/lib/validations/business-unit";
import { ensureUniqueSlug } from "@/lib/slug";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { usesVolumePricing } from "@/lib/measurement-unit";
import { Role, MeasurementUnit } from "@/types/database";

function buildBusinessUnitPayload(
  data: {
    name: string;
    description?: string | null;
    measurementUnit: MeasurementUnit;
    basePricePerUnit?: number | null;
  },
  slug: string,
  id: string
) {
  return {
    id,
    slug,
    name: data.name,
    description: data.description ?? null,
    measurement_unit: data.measurementUnit,
    base_price_per_unit: usesVolumePricing(data.measurementUnit)
      ? (data.basePricePerUnit ?? null)
      : null,
    base_currency: "NIO" as const,
  };
}

async function insertBusinessUnit(
  id: string,
  slug: string,
  data: {
    name: string;
    description?: string | null;
    measurementUnit: MeasurementUnit;
    basePricePerUnit?: number | null;
  }
) {
  const payload = buildBusinessUnitPayload(data, slug, id);
  const { error } = await db().from("business_units").insert(payload);

  if (!error) return;

  if (
    error.message.includes("slug") ||
    error.message.includes("measurement_unit") ||
    error.message.includes("base_price_per_unit")
  ) {
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
  return { id, slug };
}

export async function updateBusinessUnit(businessUnitId: string, input: unknown) {
  const { businessUnit } = await requireBusinessUnitAccess(businessUnitId, Role.ADMIN);
  const data = businessUnitUpdateSchema.parse(input);
  const slug = await ensureUniqueSlug(data.name, businessUnit.id);
  const previousSlug = businessUnit.slug;

  const updatePayload = {
    name: data.name,
    description: data.description ?? null,
    measurement_unit: data.measurementUnit,
    base_price_per_unit: usesVolumePricing(data.measurementUnit)
      ? (data.basePricePerUnit ?? null)
      : null,
    slug,
  };

  let { data: updated, error } = await db()
    .from("business_units")
    .update(updatePayload)
    .eq("id", businessUnit.id)
    .select()
    .single();

  if (
    error?.message.includes("measurement_unit") ||
    error?.message.includes("base_price_per_unit")
  ) {
    const fallback = await db()
      .from("business_units")
      .update({
        name: data.name,
        description: data.description ?? null,
        slug,
      })
      .eq("id", businessUnit.id)
      .select()
      .single();
    updated = fallback.data;
    error = fallback.error;
  }

  if (error || !updated) throw new Error(error?.message ?? "No se pudo actualizar");

  revalidatePath("/");
  revalidatePath(`/${previousSlug}`);
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/configuracion/unidad`);
  revalidatePath(`/${slug}/ingresos`);

  return {
    businessUnit: mapBusinessUnit(updated),
    slug,
    slugChanged: slug !== previousSlug,
  };
}
