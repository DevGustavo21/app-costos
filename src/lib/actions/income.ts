"use server";

import { revalidateTag } from "next/cache";
import { Currency, Role } from "@/types/database";
import { db, newId, dateOnly } from "@/lib/db/helpers";
import { mapIncomeEntry, mapPlant } from "@/lib/db/mappers";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { computeAmountUsd, getExchangeRate } from "@/lib/currency";
import { incomeActionSchema } from "@/lib/validations/income";
import type { z } from "zod";

const TAG = (buId: string) => `income-${buId}`;

async function resolveIncomeFinancials(
  parsed: z.infer<typeof incomeActionSchema>,
  businessUnitId: string,
  amount: number
) {
  const isVolumeSale = Boolean(
    parsed.isVolumeSale && parsed.saleQuantity && parsed.unitPrice
  );
  const currency = isVolumeSale ? Currency.NIO : parsed.currency;
  const exchangeRate =
    currency === Currency.NIO
      ? (parsed.exchangeRate ?? (await getExchangeRate(businessUnitId)))
      : null;
  const amountUsd = computeAmountUsd(amount, currency, exchangeRate);
  return { currency, exchangeRate, amountUsd };
}

export async function createIncomeEntry(businessUnitId: string, data: unknown) {
  const { user } = await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const parsed = incomeActionSchema.parse({ ...(data as object), businessUnitId });

  let amount = parsed.amount ?? 0;
  let saleQuantity: number | null = null;
  let unitPrice: number | null = null;
  let linesData: {
    plantId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    description?: string | null;
  }[] = [];

  if (parsed.isPlantCategory && parsed.lines?.length) {
    const plantIds = parsed.lines.map((l) => l.plantId);
    const { data: plants } = await db()
      .from("plants")
      .select("*")
      .in("id", plantIds)
      .eq("business_unit_id", businessUnitId);

    const plantMap = new Map((plants ?? []).map((p) => [p.id, mapPlant(p)]));

    linesData = parsed.lines.map((line) => {
      const plant = plantMap.get(line.plantId);
      const unitPrice = line.unitPrice ?? plant?.basePrice ?? 0;
      const subtotal = line.quantity * unitPrice;
      return {
        plantId: line.plantId,
        quantity: line.quantity,
        unitPrice,
        subtotal,
        description: line.description,
      };
    });

    amount = linesData.reduce((s, l) => s + l.subtotal, 0);
  } else if (parsed.isVolumeSale && parsed.saleQuantity && parsed.unitPrice) {
    saleQuantity = parsed.saleQuantity;
    unitPrice = parsed.unitPrice;
    amount = saleQuantity * unitPrice;
  }

  const { currency, exchangeRate: rate, amountUsd } = await resolveIncomeFinancials(
    parsed,
    businessUnitId,
    amount
  );
  const entryId = newId();

  const { error: entryError } = await db().from("income_entries").insert({
    id: entryId,
    business_unit_id: businessUnitId,
    category_id: parsed.categoryId,
    date: dateOnly(parsed.date),
    description: parsed.description,
    currency,
    amount,
    sale_quantity: saleQuantity,
    unit_price: unitPrice,
    exchange_rate: rate,
    amount_usd: amountUsd,
    created_by_id: user.id,
  });

  if (entryError) throw entryError;

  if (linesData.length) {
    const { error: linesError } = await db().from("income_lines").insert(
      linesData.map((l) => ({
        id: newId(),
        income_entry_id: entryId,
        plant_id: l.plantId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        subtotal: l.subtotal,
        description: l.description,
      }))
    );
    if (linesError) throw linesError;
  }

  const { data: entry, error } = await db()
    .from("income_entries")
    .select("*, categories(*), income_lines(*, plants(*))")
    .eq("id", entryId)
    .single();

  if (error) throw error;

  revalidateTag(TAG(businessUnitId));
  revalidateTag(`dashboard-${businessUnitId}`);
  return {
    success: true,
    entry: mapIncomeEntry({ ...entry, lines: entry.income_lines }),
  };
}

export async function updateIncomeEntry(
  businessUnitId: string,
  id: string,
  data: unknown
) {
  await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const parsed = incomeActionSchema.parse({ ...(data as object), businessUnitId, id });

  let amount = parsed.amount ?? 0;
  let saleQuantity: number | null = null;
  let unitPrice: number | null = null;
  let linesData: {
    plantId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    description?: string | null;
  }[] = [];

  if (parsed.isPlantCategory && parsed.lines?.length) {
    const plantIds = parsed.lines.map((l) => l.plantId);
    const { data: plants } = await db()
      .from("plants")
      .select("*")
      .in("id", plantIds)
      .eq("business_unit_id", businessUnitId);

    const plantMap = new Map((plants ?? []).map((p) => [p.id, mapPlant(p)]));

    linesData = parsed.lines.map((line) => {
      const plant = plantMap.get(line.plantId);
      const unitPrice = line.unitPrice ?? plant?.basePrice ?? 0;
      const subtotal = line.quantity * unitPrice;
      return {
        plantId: line.plantId,
        quantity: line.quantity,
        unitPrice,
        subtotal,
        description: line.description,
      };
    });

    amount = linesData.reduce((s, l) => s + l.subtotal, 0);
  } else if (parsed.isVolumeSale && parsed.saleQuantity && parsed.unitPrice) {
    saleQuantity = parsed.saleQuantity;
    unitPrice = parsed.unitPrice;
    amount = saleQuantity * unitPrice;
  }

  const { currency, exchangeRate: rate, amountUsd } = await resolveIncomeFinancials(
    parsed,
    businessUnitId,
    amount
  );

  await db().from("income_lines").delete().eq("income_entry_id", id);

  const { error: updateError } = await db()
    .from("income_entries")
    .update({
      category_id: parsed.categoryId,
      date: dateOnly(parsed.date),
      description: parsed.description,
      currency,
      amount,
      sale_quantity: saleQuantity,
      unit_price: unitPrice,
      exchange_rate: rate,
      amount_usd: amountUsd,
    })
    .eq("id", id)
    .eq("business_unit_id", businessUnitId);

  if (updateError) throw updateError;

  if (linesData.length) {
    await db().from("income_lines").insert(
      linesData.map((l) => ({
        id: newId(),
        income_entry_id: id,
        plant_id: l.plantId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        subtotal: l.subtotal,
        description: l.description,
      }))
    );
  }

  const { data: entry, error } = await db()
    .from("income_entries")
    .select("*, categories(*), income_lines(*, plants(*))")
    .eq("id", id)
    .single();

  if (error) throw error;

  revalidateTag(TAG(businessUnitId));
  revalidateTag(`dashboard-${businessUnitId}`);
  return {
    success: true,
    entry: mapIncomeEntry({ ...entry, lines: entry.income_lines }),
  };
}

export async function deleteIncomeEntry(businessUnitId: string, id: string) {
  await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const { error } = await db()
    .from("income_entries")
    .delete()
    .eq("id", id)
    .eq("business_unit_id", businessUnitId);
  if (error) throw error;

  revalidateTag(TAG(businessUnitId));
  revalidateTag(`dashboard-${businessUnitId}`);
  return { success: true };
}
