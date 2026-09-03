import { buildFullBackupPayload } from "@/lib/backup";
import {
  applyRestoreSelection,
  assertRestoreAllowed,
  buildRestorePlan,
  normalizeRestoreSelection,
  recordRestoreRun,
  updateRestoreRunStatus,
  uploadPreRestoreBackup,
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

  const body = await request.json().catch(() => null) as { backup?: unknown; selectedChanges?: unknown; confirmation?: unknown } | null;
  if (body?.confirmation !== "RESTAURAR") {
    return Response.json({ error: "confirmation_required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) return Response.json({ error: "restore_backend_unavailable" }, { status: 500 });

  const backupResult = validateFullBackupPayload(body.backup);
  if (!backupResult.ok) return Response.json({ error: "invalid_backup", detail: backupResult.error }, { status: 400 });

  const currentResult = await buildFullBackupPayload(supabase, session.email);
  if ("error" in currentResult) return Response.json({ error: "current_backup_failed", detail: currentResult.error }, { status: 500 });

  const plan = buildRestorePlan(backupResult.payload, currentResult.payload);
  const selectionResult = normalizeRestoreSelection(plan.report, body.selectedChanges);
  if (!selectionResult.ok) return Response.json({ error: "invalid_selection", detail: selectionResult.error }, { status: 400 });
  if (selectionResult.selection.length === 0) return Response.json({ error: "empty_selection" }, { status: 400 });

  const uploadedBackup = await uploadPreRestoreBackup(supabase, currentResult.payload);
  if ("error" in uploadedBackup) return Response.json({ error: "pre_restore_backup_failed", detail: uploadedBackup.error }, { status: 500 });

  const audit = await recordRestoreRun(supabase, {
    requestedBy: session.email,
    mode: "execute",
    sourceBackupGeneratedAt: backupResult.payload.generatedAt,
    preRestoreBackupFilename: uploadedBackup.filename,
    status: "planned",
    summary: {
      selectedCount: selectionResult.selection.length,
      unsupportedTables: plan.unsupportedTables,
    },
    selectedChanges: selectionResult.selection,
  });
  if ("error" in audit) return Response.json({ error: "restore_audit_failed", detail: audit.error }, { status: 500 });

  const result = await applyRestoreSelection(supabase, backupResult.payload, selectionResult.selection);
  if ("error" in result) {
    await updateRestoreRunStatus(supabase, audit.id, { status: "failed", error: result.error });
    return Response.json({ error: "restore_failed", detail: result.error, runId: audit.id }, { status: 500 });
  }

  await updateRestoreRunStatus(supabase, audit.id, { status: "completed", summary: { applied: result.applied } });

  return Response.json({
    runId: audit.id,
    preRestoreBackupFilename: uploadedBackup.filename,
    applied: result.applied,
  });
}
