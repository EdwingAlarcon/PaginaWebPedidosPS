export function LabelActions({ onSave, onPrint, onDownloadPdf }: { onSave: () => void; onPrint: () => void; onDownloadPdf: () => void }) {
  return (
    <div className="label-actions">
      <button className="button-primary" type="button" onClick={onSave}>Guardar rotulo</button>
      <button className="button-secondary" type="button" onClick={onPrint}>Imprimir</button>
      <button className="button-secondary" type="button" onClick={onDownloadPdf}>Descargar PDF</button>
    </div>
  );
}
