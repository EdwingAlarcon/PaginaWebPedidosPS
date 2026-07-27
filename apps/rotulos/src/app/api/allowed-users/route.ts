import { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function backendUnavailable() {
  return Response.json(
    { error: "allowed_users_backend_unavailable", detail: "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor." },
    { status: 500 },
  );
}

export async function GET() {
  const session = await requireSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  if (!supabase) return backendUnavailable();

  const { data, error } = await supabase
    .from("allowed_users")
    .select("email, created_at")
    .order("created_at", { ascending: true });
  if (error) return Response.json({ error: "list_failed", detail: error.message }, { status: 500 });

  return Response.json({ users: data ?? [], currentUserEmail: session.email });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  if (!EMAIL_PATTERN.test(email)) return Response.json({ error: "invalid_email" }, { status: 400 });

  const supabase = createServiceClient();
  if (!supabase) return backendUnavailable();

  const { error } = await supabase.from("allowed_users").insert({ email });
  if (error) return Response.json({ error: "insert_failed", detail: error.message }, { status: 500 });

  return Response.json({ email });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const email = normalizeEmail(request.nextUrl.searchParams.get("email") ?? "");
  if (!EMAIL_PATTERN.test(email)) return Response.json({ error: "invalid_email" }, { status: 400 });
  if (email === normalizeEmail(session.email)) {
    return Response.json({ error: "cannot_remove_self" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) return backendUnavailable();

  const { error } = await supabase.from("allowed_users").delete().eq("email", email);
  if (error) return Response.json({ error: "delete_failed", detail: error.message }, { status: 500 });

  return Response.json({ email });
}
