"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/auth";

export async function syncProfileAfterLogin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await ensureUserProfile(user);
}
