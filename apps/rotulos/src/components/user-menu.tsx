"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Cuenta de ${email}`}
          className="flex size-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-primary transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="truncate px-2 py-1.5 text-xs text-foreground-muted">{email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="text-danger data-[highlighted]:bg-[var(--danger-soft)]">
          <LogOut className="size-4" aria-hidden="true" />
          Cerrar sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
