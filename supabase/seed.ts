import { config } from "dotenv";
import { resolve } from "path";

// Next.js usa .env.local; cargar ambos para que `npm run db:seed` funcione igual que la app
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createAdminClient } from "../src/lib/supabase/admin";
import { CategoryType, Role, MeasurementUnit } from "../src/types/database";

const ADMIN_EMAIL = "admin@multinegocios.com";
const ADMIN_PASSWORD = "admin123";
const BUSINESS_UNIT_SLUG = "vivero-central";
const BUSINESS_UNIT_NAME = "Vivero Central";

const COST_CATEGORIES = [
  "Nómina/Salarios",
  "Renta/Alquiler",
  "Servicios básicos",
  "Insumos/Mercadería",
  "Mantenimiento",
  "Marketing/Publicidad",
  "Transporte",
  "Impuestos",
  "Honorarios profesionales",
  "Otros gastos",
];

const INCOME_CATEGORIES = [
  { name: "Ventas de productos", isPlant: false },
  { name: "Ventas de servicios", isPlant: false },
  { name: "Ventas de plantas", isPlant: true },
  { name: "Comisiones", isPlant: false },
  { name: "Intereses", isPlant: false },
  { name: "Otros ingresos", isPlant: false },
];

const PLANTS = [
  { name: "Monstera", base_price: 25.0, stock: 50 },
  { name: "Pothos", base_price: 12.0, stock: 80 },
  { name: "Ficus", base_price: 35.0, stock: 30 },
  { name: "Suculenta mix", base_price: 8.0, stock: 100 },
];

async function ensureAuthUser(supabase: ReturnType<typeof createAdminClient>) {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === ADMIN_EMAIL);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { name: "Administrador" },
  });

  if (error || !data.user) {
    throw new Error(`No se pudo crear usuario: ${error?.message}`);
  }
  return data.user;
}

async function main() {
  const supabase = createAdminClient();
  const authUser = await ensureAuthUser(supabase);

  await supabase.from("users").upsert(
    { id: authUser.id, email: ADMIN_EMAIL, name: "Administrador" },
    { onConflict: "id" }
  );

  const { data: existingBu } = await supabase
    .from("business_units")
    .select("id")
    .or(`slug.eq.${BUSINESS_UNIT_SLUG},id.eq.seed-business-unit`)
    .maybeSingle();

  const businessUnitId = existingBu?.id ?? crypto.randomUUID();

  const upsertPayload = {
    id: businessUnitId,
    slug: BUSINESS_UNIT_SLUG,
    name: BUSINESS_UNIT_NAME,
    description: "Unidad de negocio demo",
    measurement_unit: MeasurementUnit.UNIT,
  };

  const { error: upsertError } = await supabase
    .from("business_units")
    .upsert(upsertPayload, { onConflict: "id" });

  if (upsertError?.message?.includes("slug") || upsertError?.message?.includes("measurement_unit")) {
    const { error: fallbackError } = await supabase.from("business_units").upsert(
      {
        id: businessUnitId,
        name: BUSINESS_UNIT_NAME,
        description: "Unidad de negocio demo",
      },
      { onConflict: "id" }
    );
    if (fallbackError) throw new Error(fallbackError.message);
  } else if (upsertError) {
    throw new Error(upsertError.message);
  }

  const { data: existingMembership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", authUser.id)
    .eq("business_unit_id", businessUnitId)
    .maybeSingle();

  if (!existingMembership) {
    await supabase.from("memberships").insert({
      user_id: authUser.id,
      business_unit_id: businessUnitId,
      role: Role.OWNER,
    });
  }

  await supabase.from("settings").upsert(
    {
      business_unit_id: businessUnitId,
      key: "exchangeRate",
      value: "36.5",
    },
    { onConflict: "business_unit_id,key" }
  );

  for (const name of COST_CATEGORIES) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("business_unit_id", businessUnitId)
      .eq("type", CategoryType.COST)
      .eq("name", name)
      .maybeSingle();

    if (!existing) {
      await supabase.from("categories").insert({
        business_unit_id: businessUnitId,
        type: CategoryType.COST,
        name,
      });
    }
  }

  for (const cat of INCOME_CATEGORIES) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("business_unit_id", businessUnitId)
      .eq("type", CategoryType.INCOME)
      .eq("name", cat.name)
      .maybeSingle();

    if (!existing) {
      await supabase.from("categories").insert({
        business_unit_id: businessUnitId,
        type: CategoryType.INCOME,
        name: cat.name,
        is_plant_category: cat.isPlant,
      });
    }
  }

  for (const plant of PLANTS) {
    const { data: existing } = await supabase
      .from("plants")
      .select("id")
      .eq("business_unit_id", businessUnitId)
      .eq("name", plant.name)
      .maybeSingle();

    if (!existing) {
      await supabase.from("plants").insert({
        business_unit_id: businessUnitId,
        ...plant,
      });
    }
  }

  console.log("Seed completado:");
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  URL: /${BUSINESS_UNIT_SLUG}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
