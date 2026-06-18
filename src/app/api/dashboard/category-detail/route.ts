import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  getCostCategoryDetails,
  getIncomeCategoryDetails,
  parsePeriod,
} from "@/lib/queries/dashboard";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const businessUnitId = searchParams.get("businessUnitId");
  const categoryId = searchParams.get("categoryId");
  const year = parseInt(searchParams.get("year") ?? "0");
  const month = parseInt(searchParams.get("month") ?? "0");
  const isPlantCategory = searchParams.get("isPlantCategory") === "true";
  const entryType = searchParams.get("entryType") as "cost" | "income";

  if (!businessUnitId || !categoryId || !year || !month) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const period = parsePeriod(year, month);

  if (entryType === "cost") {
    const items = await getCostCategoryDetails(businessUnitId, categoryId, period);
    return NextResponse.json({ type: "entries", items });
  }

  const result = await getIncomeCategoryDetails(
    businessUnitId,
    categoryId,
    period,
    isPlantCategory
  );

  return NextResponse.json(result);
}
