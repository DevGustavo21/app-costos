"use server";

import { revalidateTag } from "next/cache";
import { CategoryType, Role } from "@/types/database";
import { db, newId } from "@/lib/db/helpers";
import { mapPlant, toPlantInsert } from "@/lib/db/mappers";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { plantActionSchema } from "@/lib/validations/plant";

const TAG = (buId: string) => `plants-${buId}`;

function throwPlantDbError(error: { code?: string; message?: string; details?: string }) {
  if (
    error.code === "PGRST200" ||
    error.message?.includes("category_id") ||
    error.details?.includes("category_id")
  ) {
    throw new Error(
      "Falta la migración de categorías en productos. Ejecute en Supabase SQL Editor: supabase/migrations/006_product_income_category.sql"
    );
  }
  throw new Error(error.message ?? "Error al acceder al catálogo de productos");
}

async function assertCatalogIncomeCategory(businessUnitId: string, categoryId: string) {
  const { data, error } = await db()
    .from("categories")
    .select("id, type, is_plant_category")
    .eq("id", categoryId)
    .eq("business_unit_id", businessUnitId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.type !== CategoryType.INCOME) {
    throw new Error("Seleccione una categoría de ingreso válida");
  }
}

export async function createPlant(businessUnitId: string, data: unknown) {
  await requireBusinessUnitAccess(businessUnitId, Role.ADMIN);
  const parsed = plantActionSchema.parse({ ...(data as object), businessUnitId });
  await assertCatalogIncomeCategory(businessUnitId, parsed.categoryId);

  const row = toPlantInsert({
    id: newId(),
    businessUnitId,
    categoryId: parsed.categoryId,
    name: parsed.name,
    description: parsed.description ?? null,
    measurementUnit: parsed.measurementUnit,
    basePrice: parsed.basePrice,
    stock: parsed.stock ?? null,
    isActive: parsed.isActive,
  });

  const { data: plant, error } = await db()
    .from("plants")
    .insert(row)
    .select("*")
    .single();
  if (error) throwPlantDbError(error);

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
  await assertCatalogIncomeCategory(businessUnitId, parsed.categoryId);

  const { data: plant, error } = await db()
    .from("plants")
    .update({
      category_id: parsed.categoryId,
      name: parsed.name,
      description: parsed.description,
      measurement_unit: parsed.measurementUnit,
      base_price: parsed.basePrice,
      stock: parsed.stock ?? null,
      is_active: parsed.isActive,
    })
    .eq("id", id)
    .eq("business_unit_id", businessUnitId)
    .select("*")
    .single();

  if (error) throwPlantDbError(error);

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

export async function getPlants(
  businessUnitId: string,
  options: { activeOnly?: boolean; categoryId?: string } = {}
) {
  let query = db()
    .from("plants")
    .select("*")
    .eq("business_unit_id", businessUnitId)
    .order("name", { ascending: true });

  if (options.activeOnly) query = query.eq("is_active", true);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);

  const { data, error } = await query;
  if (error) {
    if (options.categoryId && (error.code === "42703" || error.message?.includes("category_id"))) {
      let fallback = db()
        .from("plants")
        .select("*")
        .eq("business_unit_id", businessUnitId)
        .order("name", { ascending: true });
      if (options.activeOnly) fallback = fallback.eq("is_active", true);
      const { data: rows, error: fallbackError } = await fallback;
      if (fallbackError) throwPlantDbError(fallbackError);
      return (rows ?? []).map(mapPlant);
    }
    throwPlantDbError(error);
  }
  return (data ?? []).map(mapPlant);
}
