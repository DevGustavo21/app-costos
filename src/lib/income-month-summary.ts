import { resolveIncomeDisplay, roundMoney } from "@/lib/currency";
import { IncomeCollectionStatus, type IncomeEntryWithRelations } from "@/types/database";

type IncomeDisplayOptions = {
  volumePricing: boolean;
  defaultExchangeRate: number;
};

export type IncomeMonthSummary = {
  transactionCount: number;
  receivedTotal: number;
  receivableTotal: number;
  monthTotal: number;
};

function entryAmountUsd(
  entry: IncomeEntryWithRelations,
  options: IncomeDisplayOptions
) {
  return resolveIncomeDisplay(entry, options).amountUsd;
}

/** Totales del mes alineados con la columna Monto USD de la tabla. */
export function getIncomeMonthSummary(
  entries: IncomeEntryWithRelations[],
  options: IncomeDisplayOptions
): IncomeMonthSummary {
  let receivedTotal = 0;
  let receivableTotal = 0;

  for (const entry of entries) {
    const usd = entryAmountUsd(entry, options);
    if (entry.collectionStatus === IncomeCollectionStatus.RECEIVED) {
      receivedTotal += usd;
    } else if (entry.collectionStatus === IncomeCollectionStatus.ACCOUNTS_RECEIVABLE) {
      receivableTotal += usd;
    }
  }

  receivedTotal = roundMoney(receivedTotal);
  receivableTotal = roundMoney(receivableTotal);

  return {
    transactionCount: entries.length,
    receivedTotal,
    receivableTotal,
    monthTotal: roundMoney(receivedTotal + receivableTotal),
  };
}
