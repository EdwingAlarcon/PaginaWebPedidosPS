import { LabelForm } from "@/components/label-form";
import { PageHeading } from "@/components/ui/page-heading";

export default function CreateLabelPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Generador" title="Crear rotulo" />
      <LabelForm />
    </main>
  );
}
