"use server";

import { revalidateTag } from "next/cache";
import { Role } from "@/types/database";
import { db, newId } from "@/lib/db/helpers";
import { mapPlant, toPlantInsert } from "@/lib/db/mappers";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { plantActionSchema } from "@/lib/validations/plant";

const TAG = (buId: string) => `plants-${buId}`;

export async function createPlant(businessUnitId: string, data: unknown) {
  await requireBusinessUnitAccess(businessUnitId, Role.ADMIN);
  const parsed = plantActionSchema.parse({ ...(data as object), businessUnitId });

  const row = toPlantInsert({
    id: newId(),
    businessUnitId,
    name: parsed.name,
    description: parsed.description ?? null,
    basePrice: parsed.basePrice,
    stock: parsed.stock ?? null,
    isActive: parsed.isActive,
  });

  const { data: plant, error } = await db().from("plants").insert(row).select().single();
  if (error) throw error;

  revalidateTag(TAG(businessUnitId));
  return { success: true, plant: mapPlant(plant) };
}

export async function updatePlant(
  businessUnitId: string,
  id: string,
  data: unknown
) {
  await requireBusinessUnitAccess(businessUnitId, Role.ADMIN);
  const parsed = plantActionSchema.parse({ ...(data as object), businessUnitId, id });

  const { data: plant, error } = await db()
    .from("plants")
    .update({
      name: parsed.name,
      description: parsed.description,
      base_price: parsed.basePrice,
      stock: parsed.stock ?? null,
      is_active: parsed.isActive,
    })
    .eq("id", id)
    .eq("business_unit_id", businessUnitId)
    .select()
    .single();

  if (error) throw error;

  revalidateTag(TAG(businessUnitId));
  return { success: true, plant: mapPlant(plant) };
}

export async function deletePlant(businessUnitId: string, id: string) {
  await requireBusinessUnitAccess(businessUnitId, Role.ADMIN);

  const { count } = await db()
    .from("income_lines")
    .select("id", { count: "exact", head: true })
    .eq("plant_id", id);

  if ((count ?? 0) > 0) {
    await db()
      .from("plants")
      .update({ is_active: false })
      .eq("id", id)
      .eq("business_unit_id", businessUnitId);
  } else {
    await db().from("plants").delete().eq("id", id).eq("business_unit_id", businessUnitId);
  }

  revalidateTag(TAG(businessUnitId));
  return { success: true };
}

export async function getPlants(businessUnitId: string, activeOnly = false) {
  let query = db()
    .from("plants")
    .select("*")
    .eq("business_unit_id", businessUnitId)
    .order("name", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapPlant);
}
