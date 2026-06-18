import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

function main() {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/001_add_business_unit_slug.sql"),
    "utf8"
  );

  console.log("Ejecute este SQL en Supabase → SQL Editor:\n");
  console.log(sql);
}

main();
