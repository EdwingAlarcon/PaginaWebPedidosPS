import type { Metadata } from "next";
import { PackageCheck, Tags, BarChart3 } from "lucide-react";
import { LoginCard } from "./login-card";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Iniciar sesion — PurpleShop",
};

const BENEFITS = [
  { icon: PackageCheck, label: "Pedidos e inventario sincronizados en tiempo real" },
  { icon: Tags, label: "Rotulos de envio listos para imprimir en segundos" },
  { icon: BarChart3, label: "Reportes claros para tomar decisiones rapido" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ unauthorized?: string }>;
}) {
  const { unauthorized } = await searchParams;

  return (
    <main className="login-screen">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <section className="login-hero">
        <div className="login-hero-brand">
          <img src="/purple-shop-logo.png" alt="" width={48} height={48} className="size-12" />
          <span>Purple Shop</span>
        </div>
        <h1 className="text-display">Gestiona pedidos, clientes y envios en un solo lugar</h1>
        <ul className="login-benefits">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <li key={label}>
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </section>
      <section className="login-panel">
        <LoginCard initialUnauthorized={unauthorized === "1"} />
      </section>
    </main>
  );
}
