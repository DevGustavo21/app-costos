export const Role = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  ACCOUNTANT: "ACCOUNTANT",
  VIEWER: "VIEWER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const CategoryType = {
  COST: "COST",
  INCOME: "INCOME",
} as const;
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const Currency = {
  USD: "USD",
  NIO: "NIO",
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];

export const CostPaymentStatus = {
  PAID: "PAID",
  ACCOUNTS_PAYABLE: "ACCOUNTS_PAYABLE",
} as const;
export type CostPaymentStatus =
  (typeof CostPaymentStatus)[keyof typeof CostPaymentStatus];

export const CostExpenseReportStatus = {
  PENDING_REPORT: "PENDING_REPORT",
  REPORTED_WITH_RECEIPT: "REPORTED_WITH_RECEIPT",
  REPORTED_WITHOUT_RECEIPT: "REPORTED_WITHOUT_RECEIPT",
} as const;
export type CostExpenseReportStatus =
  (typeof CostExpenseReportStatus)[keyof typeof CostExpenseReportStatus];

export const IncomeCollectionStatus = {
  RECEIVED: "RECEIVED",
  ACCOUNTS_RECEIVABLE: "ACCOUNTS_RECEIVABLE",
} as const;
export type IncomeCollectionStatus =
  (typeof IncomeCollectionStatus)[keyof typeof IncomeCollectionStatus];

export const EntryType = {
  COST: "COST",
  INCOME: "INCOME",
} as const;
export type EntryType = (typeof EntryType)[keyof typeof EntryType];

export const MeasurementUnit = {
  UNIT: "unidad",
  LITER: "litro",
  GALLON: "galon",
  KILOGRAM: "kg",
  POUND: "libra",
  BOX: "caja",
  BAG: "bolsa",
  LIVESTOCK_HEAD: "cabeza_ganado",
} as const;
export type MeasurementUnit =
  (typeof MeasurementUnit)[keyof typeof MeasurementUnit];

export const MEASUREMENT_UNITS = Object.values(MeasurementUnit);

export const PeriodType = {
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
  CUSTOM: "CUSTOM",
} as const;
export type PeriodType = (typeof PeriodType)[keyof typeof PeriodType];

export type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  avatarPreset: string | null;
  createdAt: string;
};

export type BusinessUnit = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  measurementUnit: MeasurementUnit;
  basePricePerUnit: number | null;
  baseCurrency: Currency;
  createdAt: string;
};

export type Membership = {
  id: string;
  userId: string;
  businessUnitId: string;
  role: Role;
  businessUnit?: BusinessUnit;
};

export type Category = {
  id: string;
  businessUnitId: string | null;
  type: CategoryType;
  name: string;
  description: string | null;
  isActive: boolean;
  isPlantCategory: boolean;
  createdAt: string;
};

export type Plant = {
  id: string;
  businessUnitId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  measurementUnit: MeasurementUnit;
  basePrice: number;
  stock: number | null;
  isActive: boolean;
  createdAt: string;
  category?: Category | null;
};

export type CostEntry = {
  id: string;
  businessUnitId: string;
  categoryId: string;
  date: string;
  description: string;
  currency: Currency;
  amount: number;
  exchangeRate: number | null;
  amountUsd: number;
  receiptUrls: string[];
  paymentStatus: CostPaymentStatus;
  expenseReportStatus: CostExpenseReportStatus;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
};

export type CostEntryWithCategory = CostEntry & { category: Category };

export type IncomeLine = {
  id: string;
  incomeEntryId: string;
  plantId: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  plant?: Plant | null;
};

export type IncomeEntry = {
  id: string;
  businessUnitId: string;
  categoryId: string;
  date: string;
  description: string | null;
  currency: Currency;
  amount: number;
  saleQuantity: number | null;
  unitPrice: number | null;
  exchangeRate: number | null;
  amountUsd: number;
  collectionStatus: IncomeCollectionStatus;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  lines?: IncomeLine[];
};

export type IncomeEntryWithRelations = IncomeEntry & {
  category: Category;
  lines: IncomeLine[];
};

export type Budget = {
  id: string;
  businessUnitId: string;
  name: string;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
};

export type BudgetLine = {
  id: string;
  budgetId: string;
  categoryId: string;
  type: CategoryType;
  plannedAmountUsd: number;
  category?: Category;
};

export type Setting = {
  id: string;
  businessUnitId: string | null;
  key: string;
  value: string;
};
