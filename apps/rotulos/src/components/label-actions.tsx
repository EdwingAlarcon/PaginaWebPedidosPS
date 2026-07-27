import { Printer, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type LabelActionsProps = {
  onSave: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  saving?: boolean;
  downloading?: boolean;
  isEditing?: boolean;
};

export function LabelActions({ onSave, onPrint, onDownloadPdf, saving, downloading, isEditing }: LabelActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={onSave} loading={saving} disabled={downloading}>
        <Save className="size-4" aria-hidden="true" />
        {isEditing ? "Guardar cambios" : "Guardar rotulo"}
      </Button>
      <Button type="button" variant="secondary" onClick={onPrint} disabled={saving || downloading}>
        <Printer className="size-4" aria-hidden="true" />
        Imprimir
      </Button>
      <Button type="button" variant="secondary" onClick={onDownloadPdf} loading={downloading} disabled={saving}>
        <Download className="size-4" aria-hidden="true" />
        Descargar PDF
      </Button>
    </div>
  );
}
