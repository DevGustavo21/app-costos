import type {
  Category,
  CostEntry,
  IncomeEntry,
  IncomeLine,
  Plant,
  BusinessUnit,
  Membership,
  BudgetLine,
  MeasurementUnit,
} from "@/types/database";
import { MeasurementUnit as MU } from "@/types/database";
import { slugify } from "@/lib/slug";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function parseReceiptUrls(row: Row): string[] {
  if (Array.isArray(row.receipt_urls)) {
    return row.receipt_urls.filter(
      (url): url is string => typeof url === "string" && url.length > 0
    );
  }
  if (row.receipt_url) return [row.receipt_url as string];
  return [];
}

export function mapCategory(row: Row): Category {
  return {
    id: row.id,
    businessUnitId: row.business_unit_id,
    type: row.type,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    isPlantCategory: row.is_plant_category,
    createdAt: row.created_at,
  };
}

export function mapPlant(row: Row): Plant {
  return {
    id: row.id,
    businessUnitId: row.business_unit_id,
    categoryId: row.category_id ?? null,
    name: row.name,
    description: row.description,
    measurementUnit: (row.measurement_unit ?? MU.UNIT) as MeasurementUnit,
    basePrice: Number(row.base_price),
    stock: row.stock != null ? Number(row.stock) : null,
    isActive: row.is_active,
    createdAt: row.created_at,
    category: row.category
      ? mapCategory(row.category)
      : row.categories
        ? mapCategory(row.categories)
        : null,
  };
}

export function mapCostEntry(row: Row): CostEntry {
  return {
    id: row.id,
    businessUnitId: row.business_unit_id,
    categoryId: row.category_id,
    date: row.date,
    description: row.description,
    currency: row.currency,
    amount: Number(row.amount),
    exchangeRate: row.exchange_rate != null ? Number(row.exchange_rate) : null,
    amountUsd: Number(row.amount_usd),
    receiptUrls: parseReceiptUrls(row),
    paymentStatus: row.payment_status ?? "ACCOUNTS_PAYABLE",
    expenseReportStatus: row.expense_report_status ?? "PENDING_REPORT",
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category ? mapCategory(row.category) : row.categories ? mapCategory(row.categories) : undefined,
  };
}

export function mapIncomeLine(row: Row): IncomeLine {
  return {
    id: row.id,
    incomeEntryId: row.income_entry_id,
    plantId: row.plant_id,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
    plant: row.plant ? mapPlant(row.plant) : row.plants ? mapPlant(row.plants) : null,
  };
}

export function mapIncomeEntry(row: Row): IncomeEntry {
  return {
    id: row.id,
    businessUnitId: row.business_unit_id,
    categoryId: row.category_id,
    date: row.date,
    description: row.description,
    currency: row.currency,
    amount: Number(row.amount),
    saleQuantity: row.sale_quantity != null ? Number(row.sale_quantity) : null,
    unitPrice: row.unit_price != null ? Number(row.unit_price) : null,
    exchangeRate: row.exchange_rate != null ? Number(row.exchange_rate) : null,
    amountUsd: Number(row.amount_usd),
    collectionStatus: row.collection_status ?? "RECEIVED",
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category ? mapCategory(row.category) : row.categories ? mapCategory(row.categories) : undefined,
    lines: row.lines?.map(mapIncomeLine),
  };
}

export function mapBusinessUnit(row: Row): BusinessUnit {
  const measurementUnit = (row.measurement_unit ?? MU.UNIT) as MeasurementUnit;
  return {
    id: row.id,
    slug: row.slug ?? (slugify(row.name ?? "") || row.id),
    name: row.name,
    description: row.description,
    icon: row.icon ?? null,
    measurementUnit,
    basePricePerUnit:
      row.base_price_per_unit != null ? Number(row.base_price_per_unit) : null,
    baseCurrency: row.base_currency,
    createdAt: row.created_at,
  };
}

export function mapMembership(row: Row): Membership {
  return {
    id: row.id,
    userId: row.user_id,
    businessUnitId: row.business_unit_id,
    role: row.role,
    businessUnit: row.business_unit
      ? mapBusinessUnit(row.business_unit)
      : row.business_units
        ? mapBusinessUnit(row.business_units)
        : undefined,
  };
}

export function mapUser(row: Row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    avatarUrl: row.avatar_url ?? null,
    avatarPreset: row.avatar_preset ?? null,
    createdAt: row.created_at,
  };
}

export function mapBudgetLine(row: Row): BudgetLine {
  return {
    id: row.id,
    budgetId: row.budget_id,
    categoryId: row.category_id,
    type: row.type,
    plannedAmountUsd: Number(row.planned_amount_usd),
    category: row.category ? mapCategory(row.category) : row.categories ? mapCategory(row.categories) : undefined,
  };
}

export function toCategoryInsert(
  data: Pick<Category, "businessUnitId" | "type" | "name" | "description" | "isActive" | "isPlantCategory"> & {
    id: string;
  }
) {
  return {
    id: data.id,
    business_unit_id: data.businessUnitId,
    type: data.type,
    name: data.name,
    description: data.description,
    is_active: data.isActive,
    is_plant_category: data.isPlantCategory,
  };
}

export function toPlantInsert(
  data: Pick<
    Plant,
    | "businessUnitId"
    | "categoryId"
    | "name"
    | "description"
    | "measurementUnit"
    | "basePrice"
    | "stock"
    | "isActive"
  > & {
    id: string;
  }
) {
  return {
    id: data.id,
    business_unit_id: data.businessUnitId,
    category_id: data.categoryId,
    name: data.name,
    description: data.description,
    measurement_unit: data.measurementUnit,
    base_price: data.basePrice,
    stock: data.stock,
    is_active: data.isActive,
  };
}
