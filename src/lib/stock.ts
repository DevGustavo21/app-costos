import { db } from "@/lib/db/helpers";

export type StockQuantity = {
  plantId: string;
  quantity: number;
};

export function aggregateStockQuantities(
  lines: StockQuantity[]
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines) {
    totals.set(line.plantId, (totals.get(line.plantId) ?? 0) + line.quantity);
  }
  return totals;
}

function stockErrorMessage(name: string, available: number, requested: number) {
  return `Stock insuficiente para "${name}". Disponible: ${available}, solicitado: ${requested}`;
}

export async function validateStockAvailability(
  businessUnitId: string,
  requested: Map<string, number>,
  credits: Map<string, number> = new Map()
) {
  const plantIds = Array.from(requested.keys());
  if (plantIds.length === 0) return;

  const { data: plants, error } = await db()
    .from("plants")
    .select("id, name, stock")
    .in("id", plantIds)
    .eq("business_unit_id", businessUnitId);

  if (error) throw error;

  const plantMap = new Map((plants ?? []).map((plant) => [plant.id, plant]));

  for (const [plantId, quantity] of Array.from(requested.entries())) {
    const plant = plantMap.get(plantId);
    if (!plant) {
      throw new Error("Uno de los productos seleccionados no existe");
    }

    if (plant.stock == null) continue;

    const available = Number(plant.stock) + (credits.get(plantId) ?? 0);
    if (quantity > available) {
      throw new Error(stockErrorMessage(plant.name, available, quantity));
    }
  }
}

async function adjustPlantStock(plantId: string, delta: number) {
  const { data, error } = await db().rpc("adjust_plant_stock", {
    p_plant_id: plantId,
    p_delta: delta,
  });

  if (error) {
    if (error.message?.includes("INSUFFICIENT_STOCK")) {
      throw new Error("Stock insuficiente para uno o más productos");
    }
    if (
      error.code === "PGRST202" ||
      error.message?.includes("adjust_plant_stock")
    ) {
      await adjustPlantStockFallback(plantId, delta);
      return;
    }
    throw error;
  }

  return data as number | null;
}

async function adjustPlantStockFallback(plantId: string, delta: number) {
  const { data: plant, error } = await db()
    .from("plants")
    .select("id, name, stock")
    .eq("id", plantId)
    .single();

  if (error) throw error;
  if (plant.stock == null) return;

  const currentStock = Number(plant.stock);
  const nextStock = currentStock + delta;

  if (nextStock < 0) {
    throw new Error(`Stock insuficiente para "${plant.name}"`);
  }

  const { data: updated, error: updateError } = await db()
    .from("plants")
    .update({ stock: nextStock })
    .eq("id", plantId)
    .eq("stock", plant.stock)
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    throw new Error("El stock cambió mientras se guardaba. Intente de nuevo.");
  }
}

export async function applyStockDeltas(deltas: Map<string, number>) {
  for (const [plantId, delta] of Array.from(deltas.entries())) {
    if (delta === 0) continue;
    await adjustPlantStock(plantId, delta);
  }
}

export function computeStockDelta(
  previous: Map<string, number>,
  next: Map<string, number>
): Map<string, number> {
  const deltas = new Map<string, number>();
  const plantIds = new Set([
    ...Array.from(previous.keys()),
    ...Array.from(next.keys()),
  ]);

  for (const plantId of Array.from(plantIds)) {
    const delta = (next.get(plantId) ?? 0) - (previous.get(plantId) ?? 0);
    if (delta !== 0) {
      deltas.set(plantId, -delta);
    }
  }

  return deltas;
}

export function invertStockDeltas(deltas: Map<string, number>) {
  const inverted = new Map<string, number>();
  for (const [plantId, delta] of Array.from(deltas.entries())) {
    inverted.set(plantId, -delta);
  }
  return inverted;
}
