import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasTrustedIdentity } from "@/lib/supabase/trusted-identity";

export type ApiSession = {
  userId: string;
  email: string;
};

/**
 * Server-only session guard for Route Handlers under /api, which the
 * proxy matcher does not cover. Mirrors the login+allowlist check
 * proxy.ts does for pages.
 */
export async function requireSession(): Promise<ApiSession | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !hasTrustedIdentity(user)) return null;

  const { data: allowed } = await supabase
    .from("allowed_users")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();
  if (!allowed) return null;

  return { userId: user.id, email: user.email };
}
