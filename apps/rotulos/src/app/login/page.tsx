import type { Metadata } from "next";
import { PackageCheck, Tags, BarChart3 } from "lucide-react";
import { LoginCard } from "./login-card";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Iniciar sesión — PurpleShop",
};

const BENEFITS = [
  { icon: PackageCheck, label: "Controla pedidos e inventario en tiempo real." },
  { icon: Tags, label: "Genera rótulos listos para imprimir." },
  { icon: BarChart3, label: "Consulta información clara de tu operación." },
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

      <div className="login-card w-full max-w-[440px] rounded-lg border border-border bg-surface p-9 shadow-card">
        <div className="flex items-center gap-3">
          <img
            src="/purple-shop-logo.png"
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-full object-contain"
          />
          <span className="text-lg font-semibold text-foreground">PurpleShop</span>
        </div>

        <p className="mt-3.5 text-base leading-relaxed text-foreground-muted">
          Gestiona tus pedidos, clientes, inventario y envíos desde un solo lugar.
        </p>

        <ul className="mt-4 grid gap-2">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[13px] font-medium text-foreground-muted">
              <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        <hr className="my-6 border-border" />

        <LoginCard initialUnauthorized={unauthorized === "1"} />
      </div>
    </main>
  );
}
