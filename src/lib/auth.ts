import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/helpers";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

/** Sincroniza perfil en BD; usar en callback/login, no en cada request. */
export async function ensureUserProfile(user: {
  id: string;
  email?: string;
  user_metadata?: { name?: string; full_name?: string };
}) {
  if (!user.email) return;

  const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? null;
  await db()
    .from("users")
    .upsert({ id: user.id, email: user.email, name }, { onConflict: "id", ignoreDuplicates: true });
}

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
  };
});

export const requireAuth = cache(async () => {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return { user };
});
