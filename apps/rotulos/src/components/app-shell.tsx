import Link from "next/link";
import Image from "next/image";
import { Archive, BarChart3, ClipboardList, Home, PackagePlus, Receipt, Settings, Tags, Users } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/pedidos/nuevo", label: "Nuevo Pedido", icon: Receipt },
    { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/inventario", label: "Inventario", icon: Archive },
    { href: "/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/crear", label: "Rotulos de envio", icon: Tags },
    { href: "/historial", label: "Historial rotulos", icon: PackagePlus },
    { href: "/configuracion", label: "Configuracion", icon: Settings },
  ];

  return (
    <div className="legacy-app-shell">
      <aside className="legacy-sidebar">
        <div className="legacy-brand">
          <Image src="/purple-shop-logo.png" alt="Purple Shop" width={54} height={54} priority />
          <div>
            <strong>Purple Shop</strong>
            <span>Sistema de Gestion</span>
          </div>
        </div>
        <nav className="legacy-nav" aria-label="Navegacion principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="nav-link" href={item.href} key={item.href}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="legacy-sidebar-footer">
          <AuthPanel />
        </div>
      </aside>
      <div className="legacy-content-wrap">
        <header className="legacy-topbar">
          <div>
            <p>Purple Shop Online</p>
            <h1>Sistema de Gestion de Pedidos e Inventario</h1>
          </div>
          <AuthPanel />
        </header>
        <header className="legacy-mobile-header">
          <div className="legacy-brand compact">
            <Image src="/purple-shop-logo.png" alt="Purple Shop" width={42} height={42} />
            <strong>Purple Shop</strong>
          </div>
          <nav className="legacy-mobile-nav" aria-label="Navegacion movil">
            {navItems.map((item) => (
              <Link className="mobile-nav-link" href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
        </header>
        <div className="legacy-main">{children}</div>
      </div>
    </div>
  );
}
