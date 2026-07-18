export function OrderNumberPreview({ value }: { value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted px-4 py-3">
      <span className="block text-xs font-medium text-foreground-muted">Proximo numero estimado</span>
      <strong className="mt-1 block text-lg font-semibold text-foreground">{value}</strong>
    </div>
  );
}
