import { buildFullBackupPayload } from "@/lib/backup";
import {
  assertRestoreAllowed,
  buildRestorePlan,
  recordRestoreRun,
  validateFullBackupPayload,
} from "@/lib/backup-restore";
import { requireSession } from "@/lib/require-session";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const permission = assertRestoreAllowed(session.email);
  if (!permission.ok) return Response.json({ error: permission.error, detail: permission.detail }, { status: permission.status });

  const supabase = createServiceClient();
  if (!supabase) return Response.json({ error: "restore_backend_unavailable" }, { status: 500 });

  const body = await request.json().catch(() => null);
  const backupResult = validateFullBackupPayload((body as { backup?: unknown } | null)?.backup);
  if (!backupResult.ok) return Response.json({ error: "invalid_backup", detail: backupResult.error }, { status: 400 });

  const currentResult = await buildFullBackupPayload(supabase, session.email);
  if ("error" in currentResult) return Response.json({ error: "current_backup_failed", detail: currentResult.error }, { status: 500 });

  const plan = buildRestorePlan(backupResult.payload, currentResult.payload);
  const audit = await recordRestoreRun(supabase, {
    requestedBy: session.email,
    mode: "dry_run",
    sourceBackupGeneratedAt: backupResult.payload.generatedAt,
    status: "planned",
    summary: {
      tables: Object.fromEntries(Object.entries(plan.report.tables).map(([table, value]) => [table, value.summary])),
      unsupportedTables: plan.unsupportedTables,
    },
  });
  if ("error" in audit) return Response.json({ error: "restore_audit_failed", detail: audit.error }, { status: 500 });

  return Response.json({
    runId: audit.id,
    sourceBackupGeneratedAt: backupResult.payload.generatedAt,
    currentGeneratedAt: currentResult.payload.generatedAt,
    report: plan.report,
    warnings: plan.unsupportedTables.map((table) => `La tabla ${table} solo está disponible en lectura en esta fase.`),
  });
}
