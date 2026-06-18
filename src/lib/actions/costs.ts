"use server";

import { revalidateTag } from "next/cache";
import { Role } from "@/types/database";
import { db, newId, dateOnly } from "@/lib/db/helpers";
import { mapCostEntry } from "@/lib/db/mappers";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { computeAmountUsd, getExchangeRate } from "@/lib/currency";
import { costActionSchema } from "@/lib/validations/cost";

const TAG = (buId: string) => `costs-${buId}`;

export async function createCostEntry(businessUnitId: string, data: unknown) {
  const { user } = await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const parsed = costActionSchema.parse({ ...(data as object), businessUnitId });

  const rate =
    parsed.exchangeRate ??
    (parsed.currency === "NIO" ? await getExchangeRate(businessUnitId) : null);

  const amountUsd = computeAmountUsd(parsed.amount, parsed.currency, rate);

  const { data: entry, error } = await db()
    .from("cost_entries")
    .insert({
      id: newId(),
      business_unit_id: businessUnitId,
      category_id: parsed.categoryId,
      date: dateOnly(parsed.date),
      description: parsed.description,
      currency: parsed.currency,
      amount: parsed.amount,
      exchange_rate: rate,
      amount_usd: amountUsd,
      receipt_url: parsed.receiptUrl,
      created_by_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidateTag(TAG(businessUnitId));
  revalidateTag(`dashboard-${businessUnitId}`);
  return { success: true, entry: mapCostEntry(entry) };
}

export async function updateCostEntry(
  businessUnitId: string,
  id: string,
  data: unknown
) {
  await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const parsed = costActionSchema.parse({ ...(data as object), businessUnitId, id });

  const rate =
    parsed.exchangeRate ??
    (parsed.currency === "NIO" ? await getExchangeRate(businessUnitId) : null);

  const amountUsd = computeAmountUsd(parsed.amount, parsed.currency, rate);

  const { data: entry, error } = await db()
    .from("cost_entries")
    .update({
      category_id: parsed.categoryId,
      date: dateOnly(parsed.date),
      description: parsed.description,
      currency: parsed.currency,
      amount: parsed.amount,
      exchange_rate: rate,
      amount_usd: amountUsd,
      receipt_url: parsed.receiptUrl,
    })
    .eq("id", id)
    .eq("business_unit_id", businessUnitId)
    .select()
    .single();

  if (error) throw error;

  revalidateTag(TAG(businessUnitId));
  revalidateTag(`dashboard-${businessUnitId}`);
  return { success: true, entry: mapCostEntry(entry) };
}

export async function deleteCostEntry(businessUnitId: string, id: string) {
  await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const { error } = await db()
    .from("cost_entries")
    .delete()
    .eq("id", id)
    .eq("business_unit_id", businessUnitId);
  if (error) throw error;

  revalidateTag(TAG(businessUnitId));
  revalidateTag(`dashboard-${businessUnitId}`);
  return { success: true };
}
