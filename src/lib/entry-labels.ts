import {
  CostExpenseReportStatus,
  CostPaymentStatus,
  Currency,
  IncomeCollectionStatus,
} from "@/types/database";

export function getCostPaymentStatusLabel(status: CostPaymentStatus): string {
  switch (status) {
    case CostPaymentStatus.PAID:
      return "Pagada";
    case CostPaymentStatus.ACCOUNTS_PAYABLE:
      return "Cuenta por pagar";
    default:
      return status;
  }
}

export function getCostExpenseReportStatusLabel(
  status: CostExpenseReportStatus
): string {
  switch (status) {
    case CostExpenseReportStatus.PENDING_REPORT:
      return "Pendiente de rendir";
    case CostExpenseReportStatus.REPORTED_WITH_RECEIPT:
      return "Rendido con factura";
    case CostExpenseReportStatus.REPORTED_WITHOUT_RECEIPT:
      return "Rendido sin factura";
    default:
      return status;
  }
}

export function getIncomeCollectionStatusLabel(
  status: IncomeCollectionStatus
): string {
  switch (status) {
    case IncomeCollectionStatus.RECEIVED:
      return "Recibido";
    case IncomeCollectionStatus.ACCOUNTS_RECEIVABLE:
      return "Cuenta por cobrar";
    default:
      return status;
  }
}

export function getCurrencyLabel(currency: Currency): string {
  return currency === Currency.NIO ? "C$ (córdobas)" : "USD";
}

export const COST_PAYMENT_STATUS_OPTIONS = Object.values(CostPaymentStatus);
export const COST_EXPENSE_REPORT_STATUS_OPTIONS = Object.values(
  CostExpenseReportStatus
);
export const INCOME_COLLECTION_STATUS_OPTIONS = Object.values(
  IncomeCollectionStatus
);

export const CHANGELOG_FIELD_LABELS: Record<string, string> = {
  date: "Fecha",
  categoryId: "Categoría",
  categoryName: "Categoría",
  description: "Descripción",
  currency: "Moneda",
  amount: "Monto",
  exchangeRate: "Tasa de cambio",
  amountUsd: "Monto USD",
  receiptUrls: "Facturas",
  paymentStatus: "Estado",
  expenseReportStatus: "Rendición",
  invoiceNumber: "Nº factura",
  collectionStatus: "Estado",
  saleQuantity: "Cantidad",
  unitPrice: "Precio unitario",
  lines: "Detalle catálogo",
};
