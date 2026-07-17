import type { Metadata } from "next";
import { LoginCard } from "./login-card";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Iniciar sesion — PurpleShop",
};

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
          <img src="/purple-shop-logo.png" alt="Purple Shop" width={64} height={64} />
          <span>Purple Shop</span>
        </div>
        <h1 className="text-display">Gestiona pedidos, clientes y envios en un solo lugar</h1>
        <ul className="login-benefits">
          <li>Pedidos e inventario sincronizados en tiempo real</li>
          <li>Rotulos de envio listos para imprimir en segundos</li>
          <li>Reportes claros para tomar decisiones rapido</li>
        </ul>
      </section>
      <section className="login-panel">
        <LoginCard initialUnauthorized={unauthorized === "1"} />
      </section>
    </main>
  );
}
