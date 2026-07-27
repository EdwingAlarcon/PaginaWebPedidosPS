import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { buildFullBackupPayload } from "@/lib/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETENTION_COUNT = 30;
const BUCKET = "backups";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: "backup_backend_unavailable" }, { status: 500 });
  }

  const result = await buildFullBackupPayload(supabase, "cron");
  if ("error" in result) {
    return Response.json({ error: "backup_failed", detail: result.error }, { status: 500 });
  }

  const filename = `backup-rotulos-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, JSON.stringify(result.payload, null, 2), { contentType: "application/json" });
  if (uploadError) {
    return Response.json({ error: "upload_failed", detail: uploadError.message }, { status: 500 });
  }

  const { data: existing } = await supabase.storage.from(BUCKET).list("", {
    sortBy: { column: "name", order: "asc" },
  });
  const staleCount = Math.max(0, (existing?.length ?? 0) - RETENTION_COUNT);
  if (staleCount > 0) {
    const stale = (existing ?? []).slice(0, staleCount);
    await supabase.storage.from(BUCKET).remove(stale.map((file) => file.name));
  }

  return Response.json({ filename });
}
