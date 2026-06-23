"use server";

import { revalidateTag } from "next/cache";
import { EntryType, Role } from "@/types/database";
import { db, newId, dateOnly } from "@/lib/db/helpers";
import { mapCostEntry } from "@/lib/db/mappers";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import {
  computeAmountUsd,
  resolveExchangeRate,
} from "@/lib/currency";
import {
  buildCostSnapshot,
  getEntryChangelog,
  logEntryChange,
} from "@/lib/entry-changelog";
import { costActionSchema } from "@/lib/validations/cost";

const TAG = (buId: string) => `costs-${buId}`;

async function snapshotFromRow(
  row: ReturnType<typeof mapCostEntry>,
  categoryName?: string
) {
  return buildCostSnapshot({
    date: row.date,
    categoryId: row.categoryId,
    categoryName,
    description: row.description,
    currency: row.currency,
    amount: row.amount,
    exchangeRate: row.exchangeRate,
    amountUsd: row.amountUsd,
    receiptUrls: row.receiptUrls,
    paymentStatus: row.paymentStatus,
    expenseReportStatus: row.expenseReportStatus,
  });
}

export async function createCostEntry(businessUnitId: string, data: unknown) {
  const { user } = await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const parsed = costActionSchema.parse({ ...(data as object), businessUnitId });

  const rate = await resolveExchangeRate(
    businessUnitId,
    parsed.currency,
    parsed.exchangeRate
  );

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
      receipt_urls: parsed.receiptUrls ?? [],
      receipt_url: parsed.receiptUrls?.[0] ?? null,
      payment_status: parsed.paymentStatus,
      expense_report_status: parsed.expenseReportStatus,
      created_by_id: user.id,
    })
    .select("*, categories(name)")
    .single();

  if (error) throw error;

  const mapped = mapCostEntry(entry);
  const categoryName = entry.categories?.name ?? entry.categories?.[0]?.name;

  await logEntryChange({
    businessUnitId,
    entryType: EntryType.COST,
    entryId: mapped.id,
    action: "CREATE",
    snapshot: await snapshotFromRow(mapped, categoryName),
    changedById: user.id,
  });

  revalidateTag(TAG(businessUnitId));
  revalidateTag(`dashboard-${businessUnitId}`);
  return { success: true, entry: mapped };
}

export async function updateCostEntry(
  businessUnitId: string,
  id: string,
  data: unknown
) {
  const { user } = await requireBusinessUnitAccess(businessUnitId, Role.ACCOUNTANT);
  const parsed = costActionSchema.parse({ ...(data as object), businessUnitId, id });

  const { data: existing, error: existingError } = await db()
    .from("cost_entries")
    .select("*, categories(name)")
    .eq("id", id)
    .eq("business_unit_id", businessUnitId)
    .single();

  if (existingError || !existing) throw new Error("Costo no encontrado");

  const rate = await resolveExchangeRate(
    businessUnitId,
    parsed.currency,
    parsed.exchangeRate
  );

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
      receipt_urls: parsed.receiptUrls ?? [],
      receipt_url: parsed.receiptUrls?.[0] ?? null,
      payment_status: parsed.paymentStatus,
      expense_report_status: parsed.expenseReportStatus,
    })
    .eq("id", id)
    .eq("business_unit_id", businessUnitId)
    .select("*, categories(name)")
    .single();

  if (error) throw error;

  const mapped = mapCostEntry(entry);
  const categoryName = entry.categories?.name ?? entry.categories?.[0]?.name;
  const previous = mapCostEntry(existing);
  const previousCategoryName =
    existing.categories?.name ?? existing.categories?.[0]?.name;

  await logEntryChange({
    businessUnitId,
    entryType: EntryType.COST,
    entryId: mapped.id,
    action: "UPDATE",
    snapshot: await snapshotFromRow(mapped, categoryName),
    previousSnapshot: await snapshotFromRow(previous, previousCategoryName),
    changedById: user.id,
  });

  revalidateTag(TAG(businessUnitId));
  revalidateTag(`dashboard-${businessUnitId}`);
  return { success: true, entry: mapped };
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

export async function fetchCostChangelog(businessUnitId: string, entryId: string) {
  await requireBusinessUnitAccess(businessUnitId, Role.VIEWER);
  return getEntryChangelog(businessUnitId, EntryType.COST, entryId);
}
