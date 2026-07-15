export function LabelActions({ onSave, onPrint }: { onSave: () => void; onPrint: () => void }) {
  return (
    <div className="label-actions">
      <button className="button-primary" type="button" onClick={onSave}>Guardar rotulo</button>
      <button className="button-secondary" type="button" onClick={onPrint}>Imprimir</button>
      <button className="button-secondary" type="button" disabled>Descargar PDF</button>
    </div>
  );
}
