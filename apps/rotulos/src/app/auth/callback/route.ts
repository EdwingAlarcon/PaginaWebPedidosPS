import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Sin codigo, Supabase o Microsoft rechazaron el ingreso: se avisa en el
  // login en vez de recargarlo en silencio.
  const failed = NextResponse.redirect(`${origin}/login?error=1`);
  if (!code) return failed;

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return failed;
  }

  return NextResponse.redirect(`${origin}/`);
}
