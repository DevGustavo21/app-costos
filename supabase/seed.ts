import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createAdminClient } from "../src/lib/supabase/admin";

const ADMIN_EMAIL = "admin@multinegocios.com";
const ADMIN_PASSWORD = "admin123";

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

  console.log("Seed completado:");
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log("  Solo usuario administrador (sin datos de ejemplo).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
