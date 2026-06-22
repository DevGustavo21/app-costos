import type { IncomeEntryWithRelations, Plant } from "@/types/database";
import type { IncomeEntryFormValues } from "@/lib/validations/income";

export function tracksStock(plant: Plant) {
  return plant.stock != null;
}

export function isOutOfStock(plant: Plant) {
  return tracksStock(plant) && plant.stock! <= 0;
}

export function getOriginalSoldQuantity(
  editEntry: IncomeEntryWithRelations | null | undefined,
  plantId: string
) {
  return (editEntry?.lines ?? [])
    .filter((line) => line.plantId === plantId)
    .reduce((sum, line) => sum + line.quantity, 0);
}

function getReservedQuantity(
  lines: IncomeEntryFormValues["lines"],
  plantId: string,
  excludeIndex?: number
) {
  return (lines ?? [])
    .filter((line, index) => line.plantId === plantId && index !== excludeIndex)
    .reduce((sum, line) => sum + (line.quantity ?? 0), 0);
}

export function getAvailableStock(
  plant: Plant,
  lines: IncomeEntryFormValues["lines"],
  lineIndex: number,
  editEntry?: IncomeEntryWithRelations | null
) {
  if (!tracksStock(plant)) return null;

  const reserved = getReservedQuantity(lines, plant.id, lineIndex);
  const original = getOriginalSoldQuantity(editEntry, plant.id);
  return plant.stock! + original - reserved;
}

export function validateCatalogStock(
  lines: IncomeEntryFormValues["lines"],
  products: Plant[],
  editEntry?: IncomeEntryWithRelations | null
) {
  const totals = new Map<string, number>();

  for (const line of lines ?? []) {
    if (!line.plantId || !line.quantity) continue;
    totals.set(line.plantId, (totals.get(line.plantId) ?? 0) + line.quantity);
  }

  for (const [plantId, quantity] of Array.from(totals.entries())) {
    const plant = products.find((item) => item.id === plantId);
    if (!plant || !tracksStock(plant)) continue;

    const available = plant.stock! + getOriginalSoldQuantity(editEntry, plantId);
    if (quantity > available) {
      return `Stock insuficiente para "${plant.name}". Disponible: ${available}`;
    }
  }

  return null;
}
