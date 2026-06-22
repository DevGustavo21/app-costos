import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createAdminClient } from "../src/lib/supabase/admin";

const DEMO_SLUGS = ["vivero-central"];
const DEMO_NAMES = ["Vivero Central", "vivero central"];
const DEMO_IDS = ["seed-business-unit"];

async function main() {
  const supabase = createAdminClient();

  const { data: units, error } = await supabase
    .from("business_units")
    .select("id, name, slug");

  if (error) throw error;

  const demoUnits = (units ?? []).filter(
    (unit) =>
      DEMO_IDS.includes(unit.id) ||
      (unit.slug && DEMO_SLUGS.includes(unit.slug)) ||
      DEMO_NAMES.some((name) => unit.name?.toLowerCase() === name.toLowerCase())
  );

  if (demoUnits.length === 0) {
    console.log("No se encontraron unidades de negocio de ejemplo.");
    return;
  }

  for (const unit of demoUnits) {
    const { error: deleteError } = await supabase
      .from("business_units")
      .delete()
      .eq("id", unit.id);

    if (deleteError) {
      throw new Error(`No se pudo eliminar ${unit.name}: ${deleteError.message}`);
    }

    console.log(`Eliminada unidad de ejemplo: ${unit.name} (${unit.slug ?? unit.id})`);
  }

  console.log("Limpieza de datos de ejemplo completada.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
