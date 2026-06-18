"use server";

import { revalidateTag } from "next/cache";
import { CategoryType, Role } from "@/types/database";
import { db, newId } from "@/lib/db/helpers";
import { mapCategory, toCategoryInsert } from "@/lib/db/mappers";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { categoryActionSchema } from "@/lib/validations/category";

const TAG = (buId: string, type: CategoryType) => `categories-${buId}-${type}`;

export async function createCategory(
  businessUnitId: string,
  type: CategoryType,
  data: unknown
) {
  await requireBusinessUnitAccess(businessUnitId, Role.ADMIN);
  const parsed = categoryActionSchema.parse({ ...(data as object), businessUnitId, type });

  const row = toCategoryInsert({
    id: newId(),
    businessUnitId,
    type,
    name: parsed.name,
    description: parsed.description ?? null,
    isActive: parsed.isActive,
    isPlantCategory: type === CategoryType.INCOME ? parsed.isPlantCategory : false,
  });

  const { data: category, error } = await db().from("categories").insert(row).select().single();
  if (error) throw error;

  revalidateTag(TAG(businessUnitId, type));
  return { success: true, category: mapCategory(category) };
}

export async function updateCategory(
  businessUnitId: string,
  type: CategoryType,
  id: string,
  data: unknown
) {
  await requireBusinessUnitAccess(businessUnitId, Role.ADMIN);
  const parsed = categoryActionSchema.parse({ ...(data as object), businessUnitId, type, id });

  const { data: category, error } = await db()
    .from("categories")
    .update({
      name: parsed.name,
      description: parsed.description,
      is_active: parsed.isActive,
      is_plant_category: type === CategoryType.INCOME ? parsed.isPlantCategory : false,
    })
    .eq("id", id)
    .eq("business_unit_id", businessUnitId)
    .select()
    .single();

  if (error) throw error;

  revalidateTag(TAG(businessUnitId, type));
  return { success: true, category: mapCategory(category) };
}

export async function deleteCategory(
  businessUnitId: string,
  type: CategoryType,
  id: string
) {
  await requireBusinessUnitAccess(businessUnitId, Role.ADMIN);

  const table = type === CategoryType.COST ? "cost_entries" : "income_entries";
  const { count } = await db()
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    await db()
      .from("categories")
      .update({ is_active: false })
      .eq("id", id)
      .eq("business_unit_id", businessUnitId);
  } else {
    await db()
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("business_unit_id", businessUnitId);
  }

  revalidateTag(TAG(businessUnitId, type));
  return { success: true };
}

export async function getCategories(
  businessUnitId: string,
  type: CategoryType,
  activeOnly = false
) {
  let query = db()
    .from("categories")
    .select("*")
    .eq("business_unit_id", businessUnitId)
    .eq("type", type)
    .order("name", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapCategory);
}
