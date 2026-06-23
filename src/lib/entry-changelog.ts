import { db, newId } from "@/lib/db/helpers";
import { mapUser } from "@/lib/db/mappers";
import type { EntryType } from "@/types/database";

export type ChangelogSnapshot = Record<string, unknown>;

export type EntryChangelogRow = {
  id: string;
  businessUnitId: string;
  entryType: EntryType;
  entryId: string;
  action: "CREATE" | "UPDATE";
  snapshot: ChangelogSnapshot;
  previousSnapshot: ChangelogSnapshot | null;
  changedById: string | null;
  changedByName: string | null;
  createdAt: string;
};

export async function logEntryChange(params: {
  businessUnitId: string;
  entryType: EntryType;
  entryId: string;
  action: "CREATE" | "UPDATE";
  snapshot: ChangelogSnapshot;
  previousSnapshot?: ChangelogSnapshot | null;
  changedById?: string | null;
}) {
  const { error } = await db().from("entry_changelog").insert({
    id: newId(),
    business_unit_id: params.businessUnitId,
    entry_type: params.entryType,
    entry_id: params.entryId,
    action: params.action,
    snapshot: params.snapshot,
    previous_snapshot: params.previousSnapshot ?? null,
    changed_by_id: params.changedById ?? null,
  });

  if (error) throw error;
}

export async function getEntryChangelog(
  businessUnitId: string,
  entryType: EntryType,
  entryId: string
): Promise<EntryChangelogRow[]> {
  const { data, error } = await db()
    .from("entry_changelog")
    .select("*, users(id, name, email)")
    .eq("business_unit_id", businessUnitId)
    .eq("entry_type", entryType)
    .eq("entry_id", entryId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const userRow = Array.isArray(row.users) ? row.users[0] : row.users;
    const user = userRow ? mapUser(userRow) : null;

    return {
      id: row.id,
      businessUnitId: row.business_unit_id,
      entryType: row.entry_type,
      entryId: row.entry_id,
      action: row.action,
      snapshot: row.snapshot as ChangelogSnapshot,
      previousSnapshot: (row.previous_snapshot as ChangelogSnapshot | null) ?? null,
      changedById: row.changed_by_id,
      changedByName: user?.name ?? user?.email ?? null,
      createdAt: row.created_at,
    };
  });
}

export function buildCostSnapshot(entry: {
  date: string;
  categoryId: string;
  categoryName?: string;
  description: string;
  currency: string;
  amount: number;
  exchangeRate: number | null;
  amountUsd: number;
  receiptUrls: string[];
  paymentStatus: string;
  expenseReportStatus: string;
  invoiceNumber?: string | null;
}): ChangelogSnapshot {
  return {
    date: entry.date,
    categoryName: entry.categoryName,
    description: entry.description,
    currency: entry.currency,
    amount: entry.amount,
    exchangeRate: entry.exchangeRate,
    amountUsd: entry.amountUsd,
    receiptUrls: entry.receiptUrls,
    paymentStatus: entry.paymentStatus,
    expenseReportStatus: entry.expenseReportStatus,
    invoiceNumber: entry.invoiceNumber ?? null,
  };
}

export function buildIncomeSnapshot(entry: {
  date: string;
  categoryId: string;
  categoryName?: string;
  description: string | null;
  currency: string;
  amount: number;
  exchangeRate: number | null;
  amountUsd: number;
  collectionStatus: string;
  saleQuantity?: number | null;
  unitPrice?: number | null;
  lines?: Array<{
    plantName?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}): ChangelogSnapshot {
  return {
    date: entry.date,
    categoryName: entry.categoryName,
    description: entry.description,
    currency: entry.currency,
    amount: entry.amount,
    exchangeRate: entry.exchangeRate,
    amountUsd: entry.amountUsd,
    collectionStatus: entry.collectionStatus,
    saleQuantity: entry.saleQuantity,
    unitPrice: entry.unitPrice,
    lines: entry.lines,
  };
}
