import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  computeAmountNio,
  computeAmountUsd,
  formatNio,
  formatUsd,
} from "@/lib/currency";
import {
  getCostExpenseReportStatusLabel,
  getCostPaymentStatusLabel,
  getCurrencyLabel,
  getIncomeCollectionStatusLabel,
} from "@/lib/entry-labels";
import { parseLocalDate } from "@/lib/db/helpers";
import { Currency, EntryType } from "@/types/database";
import type { ChangelogSnapshot } from "@/lib/entry-changelog";

const DEFAULT_RATE = 36.5;

export type ChangelogLineRow = {
  id: string;
  product: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
};

export type ChangelogIncomeRow = {
  id: string;
  date: string;
  category: string;
  status: string;
  description: string;
  amountNio: string;
  amountUsd: string;
  saleDetail: string;
  lines: ChangelogLineRow[];
};

export type ChangelogCostRow = {
  id: string;
  date: string;
  category: string;
  paymentStatus: string;
  expenseReportStatus: string;
  invoiceNumber: string;
  description: string;
  amountNio: string;
  amountUsd: string;
  receipt: string;
};

function formatSnapshotDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  try {
    return format(parseLocalDate(value), "dd/MM/yyyy", { locale: es });
  } catch {
    return String(value);
  }
}

function resolveRates(snapshot: ChangelogSnapshot) {
  const currency = (snapshot.currency as Currency) ?? Currency.NIO;
  const amount = Number(snapshot.amount ?? 0);
  const exchangeRate =
    snapshot.exchangeRate != null ? Number(snapshot.exchangeRate) : DEFAULT_RATE;

  const amountNio =
    currency === Currency.NIO
      ? amount
      : computeAmountNio(amount, Currency.USD, exchangeRate);
  const amountUsd =
    currency === Currency.USD
      ? amount
      : computeAmountUsd(amount, Currency.NIO, exchangeRate);

  return { amountNio, amountUsd };
}

function mapLines(snapshot: ChangelogSnapshot): ChangelogLineRow[] {
  const lines = snapshot.lines;
  if (!Array.isArray(lines) || lines.length === 0) return [];

  return lines.map((line, index) => {
    const row = line as Record<string, unknown>;
    const quantity = Number(row.quantity ?? 0);
    const unitPrice = Number(row.unitPrice ?? 0);
    const subtotal = Number(row.subtotal ?? quantity * unitPrice);

    return {
      id: String(index),
      product: String(row.plantName ?? row.description ?? "—"),
      quantity: String(quantity),
      unitPrice: formatNio(unitPrice),
      subtotal: formatNio(subtotal),
    };
  });
}

export function normalizeIncomeSnapshot(
  snapshot: ChangelogSnapshot,
  rowId = "snapshot"
): ChangelogIncomeRow {
  const { amountNio, amountUsd } = resolveRates(snapshot);
  const saleQuantity = snapshot.saleQuantity;
  const unitPrice = snapshot.unitPrice;

  let saleDetail = "—";
  if (saleQuantity != null && unitPrice != null) {
    saleDetail = `${saleQuantity} × ${formatNio(Number(unitPrice))}`;
  }

  return {
    id: rowId,
    date: formatSnapshotDate(snapshot.date),
    category: String(snapshot.categoryName ?? snapshot.categoryId ?? "—"),
    status: getIncomeCollectionStatusLabel(
      String(snapshot.collectionStatus ?? "RECEIVED") as never
    ),
    description: String(snapshot.description ?? "—"),
    amountNio: formatNio(amountNio),
    amountUsd: formatUsd(amountUsd),
    saleDetail,
    lines: mapLines(snapshot),
  };
}

export function normalizeCostSnapshot(
  snapshot: ChangelogSnapshot,
  rowId = "snapshot"
): ChangelogCostRow {
  const { amountNio, amountUsd } = resolveRates(snapshot);
  const receiptUrls = Array.isArray(snapshot.receiptUrls)
    ? (snapshot.receiptUrls as string[])
    : snapshot.receiptUrl
      ? [String(snapshot.receiptUrl)]
      : [];

  return {
    id: rowId,
    date: formatSnapshotDate(snapshot.date),
    category: String(snapshot.categoryName ?? snapshot.categoryId ?? "—"),
    paymentStatus: getCostPaymentStatusLabel(
      String(snapshot.paymentStatus ?? "ACCOUNTS_PAYABLE") as never
    ),
    expenseReportStatus: getCostExpenseReportStatusLabel(
      String(snapshot.expenseReportStatus ?? "PENDING_REPORT") as never
    ),
    invoiceNumber: String(snapshot.invoiceNumber ?? "—"),
    description: String(snapshot.description ?? "—"),
    amountNio: formatNio(amountNio),
    amountUsd: formatUsd(amountUsd),
    receipt: receiptUrls.length > 0 ? `${receiptUrls.length} adjunta(s)` : "—",
  };
}

export const INCOME_CHANGELOG_FIELDS = [
  "date",
  "category",
  "status",
  "description",
  "amountNio",
  "amountUsd",
  "saleDetail",
] as const;

export const COST_CHANGELOG_FIELDS = [
  "date",
  "category",
  "paymentStatus",
  "expenseReportStatus",
  "invoiceNumber",
  "description",
  "amountNio",
  "amountUsd",
  "receipt",
] as const;

export function getChangedIncomeFields(
  current: ChangelogIncomeRow,
  previous?: ChangelogIncomeRow | null
): Set<string> {
  if (!previous) return new Set(INCOME_CHANGELOG_FIELDS);
  const changed = new Set<string>();
  for (const key of INCOME_CHANGELOG_FIELDS) {
    if (current[key] !== previous[key]) changed.add(key);
  }
  if (JSON.stringify(current.lines) !== JSON.stringify(previous.lines)) {
    changed.add("lines");
  }
  return changed;
}

export function getChangedCostFields(
  current: ChangelogCostRow,
  previous?: ChangelogCostRow | null
): Set<string> {
  if (!previous) return new Set(COST_CHANGELOG_FIELDS);
  const changed = new Set<string>();
  for (const key of COST_CHANGELOG_FIELDS) {
    if (current[key] !== previous[key]) changed.add(key);
  }
  return changed;
}

export function getCurrencyNote(snapshot: ChangelogSnapshot): string | null {
  if (!snapshot.currency) return null;
  const currency = snapshot.currency as Currency;
  const rate = snapshot.exchangeRate;
  if (currency === Currency.USD && rate != null) {
    return `${getCurrencyLabel(currency)} · Tasa ${rate}`;
  }
  return getCurrencyLabel(currency);
}

export type ChangelogEntryType = (typeof EntryType)[keyof typeof EntryType];
