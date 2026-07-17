"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!hasSupabaseEnv() || !email) return null;

  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="user-menu">
      <span className="user-menu-avatar" aria-hidden="true">{initials}</span>
      <span className="user-menu-email">{email}</span>
      <button type="button" className="user-menu-signout" onClick={signOut}>
        Cerrar sesion
      </button>
    </div>
  );
}
