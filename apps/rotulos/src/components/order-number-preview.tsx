export function OrderNumberPreview({ value }: { value: string }) {
  return (
    <div className="order-preview">
      <span>Proximo numero estimado</span>
      <strong>{value}</strong>
    </div>
  );
}
