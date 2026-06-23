"use server";

import { revalidateTag } from "next/cache";
import { Currency, EntryType, Role } from "@/types/database";
import { db, newId, dateOnly } from "@/lib/db/helpers";
import { mapIncomeEntry, mapPlant } from "@/lib/db/mappers";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { computeAmountUsd, resolveExchangeRate } from "@/lib/currency";
import {
  buildIncomeSnapshot,
  getEntryChangelog,
  logEntryChange,
} from "@/lib/entry-changelog";
import {
  aggregateStockQuantities,
  applyStockDeltas,
  computeStockDelta,
  invertStockDeltas,
  validateStockAvailability,
} from "@/lib/stock";
import { incomeActionSchema } from "@/lib/validations/income";
import type { z } from "zod";

const TAG = (buId: string) => `income-${buId}`;
const PLANTS_TAG = (buId: string) => `plants-${buId}`;

type LineData = {
  plantId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  description?: string | null;
};

async function resolveIncomeFinancials(
  parsed: z.infer<typeof incomeActionSchema>,
  businessUnitId: string,
  amount: number
) {
  const isVolumeSale = Boolean(
    parsed.isVolumeSale && parsed.saleQuantity && parsed.unitPrice
  );
  const currency = isVolumeSale ? Currency.NIO : parsed.currency;
  const exchangeRate = await resolveExchangeRate(
    businessUnitId,
    currency,
    parsed.exchangeRate
  );
  const amountUsd = computeAmountUsd(amount, currency, exchangeRate);
  return { currency, exchangeRate, amountUsd };
}

async function buildCatalogLines(
  parsed: z.infer<typeof incomeActionSchema>,
  businessUnitId: string
): Promise<LineData[]> {
  if (!parsed.isPlantCategory || !parsed.lines?.length) return [];

  const plantIds = parsed.lines.map((l) => l.plantId);
  const { data: plants } = await db()
    .from("plants")
    .select("*")
    .in("id", plantIds)
    .eq("business_unit_id", businessUnitId);

  const plantMap = new Map((plants ?? []).map((p) => [p.id, mapPlant(p)]));

  return parsed.lines.map((line) => {
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
}

async function loadEntryLineQuantities(entryId: string) {
  const { data, error } = await db()
    .from("income_lines")
    .select("plant_id, quantity")
    .eq("income_entry_id", entryId);

  if (error) throw error;

  return aggregateStockQuantities(
    (data ?? [])
      .filter((line) => line.plant_id)
      .map((line) => ({
        plantId: line.plant_id as string,
        quantity: Number(line.quantity),
      }))
  );
}

function revalidateIncome(businessUnitId: string) {
  revalidateTag(TAG(businessUnitId));
  revalidateTag(`dashboard-${businessUnitId}`);
  revalidateTag(PLANTS_TAG(businessUnitId));
}

function incomeSnapshotFromEntry(
  entry: ReturnType<typeof mapIncomeEntry>
) {
  return buildIncomeSnapshot({
    date: entry.date,
    categoryId: entry.categoryId,
    categoryName: entry.category?.name,
    description: entry.description,
    currency: entry.currency,
    amount: entry.amount,
    exchangeRate: entry.exchangeRate,
    amountUsd: entry.amountUsd,
    collectionStatus: entry.collectionStatus,
    saleQuantity: entry.saleQuantity,
    unitPrice: entry.unitPrice,
    lines: entry.lines?.map((line) => ({
      plantName: line.plant?.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotal: line.subtotal,
    })),
  });
}

export async function createIncomeEntry(businessUnitId: string, data: unknown) {
  const { user } = await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const parsed = incomeActionSchema.parse({ ...(data as object), businessUnitId });

  const linesData = await buildCatalogLines(parsed, businessUnitId);

  let amount = parsed.amount ?? 0;
  let saleQuantity: number | null = null;
  let unitPrice: number | null = null;

  if (linesData.length) {
    amount = linesData.reduce((s, l) => s + l.subtotal, 0);
    const requested = aggregateStockQuantities(linesData);
    await validateStockAvailability(businessUnitId, requested);
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
    collection_status: parsed.collectionStatus,
    created_by_id: user.id,
  });

  if (entryError) throw entryError;

  if (linesData.length) {
    const stockDeltas = computeStockDelta(new Map(), aggregateStockQuantities(linesData));

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

    if (linesError) {
      await db().from("income_entries").delete().eq("id", entryId);
      throw linesError;
    }

    try {
      await applyStockDeltas(stockDeltas);
    } catch (error) {
      await db().from("income_entries").delete().eq("id", entryId);
      throw error;
    }
  }

  const { data: entry, error } = await db()
    .from("income_entries")
    .select("*, categories(*), income_lines(*, plants(*))")
    .eq("id", entryId)
    .single();

  if (error) throw error;

  const mapped = mapIncomeEntry({ ...entry, lines: entry.income_lines });
  await logEntryChange({
    businessUnitId,
    entryType: EntryType.INCOME,
    entryId: mapped.id,
    action: "CREATE",
    snapshot: incomeSnapshotFromEntry(mapped),
    changedById: user.id,
  });

  revalidateIncome(businessUnitId);
  return {
    success: true,
    entry: mapped,
  };
}

export async function updateIncomeEntry(
  businessUnitId: string,
  id: string,
  data: unknown
) {
  const { user } = await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const parsed = incomeActionSchema.parse({ ...(data as object), businessUnitId, id });

  const { data: existingRow, error: existingError } = await db()
    .from("income_entries")
    .select("*, categories(*), income_lines(*, plants(*))")
    .eq("id", id)
    .eq("business_unit_id", businessUnitId)
    .single();

  if (existingError || !existingRow) throw new Error("Ingreso no encontrado");

  const previousEntry = mapIncomeEntry({
    ...existingRow,
    lines: existingRow.income_lines,
  });

  const previousQuantities = await loadEntryLineQuantities(id);
  const linesData = await buildCatalogLines(parsed, businessUnitId);

  let amount = parsed.amount ?? 0;
  let saleQuantity: number | null = null;
  let unitPrice: number | null = null;

  if (linesData.length) {
    amount = linesData.reduce((s, l) => s + l.subtotal, 0);
    const requested = aggregateStockQuantities(linesData);
    await validateStockAvailability(businessUnitId, requested, previousQuantities);
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

  const nextQuantities = aggregateStockQuantities(linesData);
  const stockDeltas = computeStockDelta(previousQuantities, nextQuantities);

  if (stockDeltas.size > 0) {
    await applyStockDeltas(stockDeltas);
  }

  try {
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
        collection_status: parsed.collectionStatus,
      })
      .eq("id", id)
      .eq("business_unit_id", businessUnitId);

    if (updateError) throw updateError;

    if (linesData.length) {
      const { error: linesError } = await db().from("income_lines").insert(
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
      if (linesError) throw linesError;
    }
  } catch (error) {
    if (stockDeltas.size > 0) {
      await applyStockDeltas(invertStockDeltas(stockDeltas)).catch(() => undefined);
    }
    throw error;
  }

  const { data: entry, error } = await db()
    .from("income_entries")
    .select("*, categories(*), income_lines(*, plants(*))")
    .eq("id", id)
    .single();

  if (error) throw error;

  const mapped = mapIncomeEntry({ ...entry, lines: entry.income_lines });
  await logEntryChange({
    businessUnitId,
    entryType: EntryType.INCOME,
    entryId: mapped.id,
    action: "UPDATE",
    snapshot: incomeSnapshotFromEntry(mapped),
    previousSnapshot: incomeSnapshotFromEntry(previousEntry),
    changedById: user.id,
  });

  revalidateIncome(businessUnitId);
  return {
    success: true,
    entry: mapped,
  };
}

export async function deleteIncomeEntry(businessUnitId: string, id: string) {
  await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);

  const previousQuantities = await loadEntryLineQuantities(id);
  const stockDeltas = computeStockDelta(previousQuantities, new Map());

  if (stockDeltas.size > 0) {
    await applyStockDeltas(stockDeltas);
  }

  const { error } = await db()
    .from("income_entries")
    .delete()
    .eq("id", id)
    .eq("business_unit_id", businessUnitId);

  if (error) {
    if (stockDeltas.size > 0) {
      await applyStockDeltas(invertStockDeltas(stockDeltas)).catch(() => undefined);
    }
    throw error;
  }

  revalidateIncome(businessUnitId);
  return { success: true };
}

export async function fetchIncomeChangelog(
  businessUnitId: string,
  entryId: string
) {
  await requireBusinessUnitAccess(businessUnitId, Role.VIEWER);
  return getEntryChangelog(businessUnitId, EntryType.INCOME, entryId);
}
