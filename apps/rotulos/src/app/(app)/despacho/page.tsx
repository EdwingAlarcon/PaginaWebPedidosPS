import { DispatchBoard } from "@/components/dispatch-board";
import { PageHeading } from "@/components/ui/page-heading";

export default function DispatchPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Envíos" title="Bandeja de despacho" />
      <DispatchBoard />
    </main>
  );
}
