import { CatalogGenerator } from "@/components/catalog-generator";
import { ProductCodesTable } from "@/components/product-codes-table";
import { PageHeading } from "@/components/ui/page-heading";

export default function CatalogPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Ventas" title="Catálogo" />
      <CatalogGenerator />
      <ProductCodesTable />
    </main>
  );
}
