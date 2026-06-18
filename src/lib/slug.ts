import { db } from "@/lib/db/helpers";

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function slugColumnExists(): Promise<boolean> {
  const { error } = await db().from("business_units").select("slug").limit(1);
  return !error?.message?.includes("slug");
}

export async function ensureUniqueSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  let base = slugify(name);
  if (!base) base = "unidad";

  const hasSlugColumn = await slugColumnExists();
  let candidate = base;
  let suffix = 2;

  while (true) {
    if (hasSlugColumn) {
      const { data } = await db()
        .from("business_units")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (!data || data.id === excludeId) return candidate;
    } else {
      const { data: all } = await db().from("business_units").select("id, name, slug");
      const taken = (all ?? []).some(
        (row) =>
          row.id !== excludeId &&
          (slugify(row.name ?? "") === candidate || row.slug === candidate)
      );
      if (!taken) return candidate;
    }

    candidate = `${base}-${suffix++}`;
  }
}
