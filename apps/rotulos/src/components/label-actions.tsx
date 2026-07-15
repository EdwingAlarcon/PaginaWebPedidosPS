export function LabelActions({ onSave }: { onSave: () => void }) {
  return (
    <div className="label-actions">
      <button className="button-primary" type="button" onClick={onSave}>Guardar rotulo</button>
      <button className="button-secondary" type="button" onClick={() => window.print()}>Imprimir</button>
      <button className="button-secondary" type="button" disabled>Descargar PDF</button>
    </div>
  );
}
