import { Printer, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LabelActions({ onSave, onPrint, onDownloadPdf }: { onSave: () => void; onPrint: () => void; onDownloadPdf: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={onSave}>
        <Save className="size-4" aria-hidden="true" />
        Guardar rotulo
      </Button>
      <Button type="button" variant="secondary" onClick={onPrint}>
        <Printer className="size-4" aria-hidden="true" />
        Imprimir
      </Button>
      <Button type="button" variant="secondary" onClick={onDownloadPdf}>
        <Download className="size-4" aria-hidden="true" />
        Descargar PDF
      </Button>
    </div>
  );
}
