"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  ClipboardList,
  Home,
  Menu,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { SyncStatus } from "@/components/sync-status";

const COLLAPSE_STORAGE_KEY = "purpleshop.sidebar-collapsed";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Inicio", icon: Home },
      { href: "/pedidos/nuevo", label: "Nuevo pedido", icon: Receipt },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/inventario", label: "Inventario", icon: Archive },
      { href: "/reportes", label: "Reportes", icon: BarChart3 },
    ],
  },
  {
    label: "Envios",
    items: [
      { href: "/crear", label: "Crear rotulo", icon: Tags },
      { href: "/historial", label: "Historial", icon: PackagePlus },
    ],
  },
  {
    label: "Sistema",
    items: [{ href: "/configuracion", label: "Configuracion", icon: Settings }],
  },
];

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": { title: "Inicio", description: "Resumen de la operacion diaria" },
  "/pedidos/nuevo": { title: "Nuevo pedido", description: "Registra un pedido para un cliente" },
  "/pedidos": { title: "Pedidos", description: "Consulta y gestiona los pedidos registrados" },
  "/clientes": { title: "Clientes", description: "Historial y datos de contacto de tus clientes" },
  "/inventario": { title: "Inventario", description: "Productos, stock y movimientos" },
  "/reportes": { title: "Reportes", description: "Ventas, productos y tendencias" },
  "/crear": { title: "Crear rotulo", description: "Genera el rotulo de envio de un pedido" },
  "/historial": { title: "Historial", description: "Rotulos generados anteriormente" },
  "/configuracion": { title: "Configuracion", description: "Ajustes de la aplicacion" },
};

const DEFAULT_PAGE_META = { title: "PurpleShop", description: "Sistema de gestion de pedidos e inventario" };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted UI preference once after mount
    if (stored === "true") setCollapsed(true);
  }, []);

  function closeMobileDrawer() {
    setMobileOpen(false);
    mobileToggleRef.current?.focus();
  }

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobileDrawer();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  }

  const pageMeta = PAGE_META[pathname ?? ""] ?? DEFAULT_PAGE_META;

  return (
    <div className="legacy-app-shell">
      <aside className={`legacy-sidebar${collapsed ? " collapsed" : ""}`}>
        <div className="legacy-sidebar-header">
          <div className="legacy-brand">
            <Image src="/purple-shop-logo.png" alt="Purple Shop" width={40} height={40} priority />
            {!collapsed && (
              <div>
                <strong>Purple Shop</strong>
                <span>Sistema de Gestion</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menu" : "Contraer menu"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav className="legacy-nav" aria-label="Navegacion principal">
          {NAV_GROUPS.map((group) => (
            <div className="sidebar-group" key={group.label}>
              {!collapsed && <p className="sidebar-group-label">{group.label}</p>}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    className={`nav-link${active ? " active" : ""}`}
                    href={item.href}
                    key={item.href}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="legacy-sidebar-footer">
          <SyncStatus />
          <UserMenu />
        </div>
      </aside>

      <div className="legacy-content-wrap">
        <header className="legacy-topbar">
          <div>
            <p>{pageMeta.title}</p>
            <h1>{pageMeta.description}</h1>
          </div>
          <div className="legacy-topbar-actions">
            <SyncStatus />
            <UserMenu />
          </div>
        </header>

        <header className="legacy-mobile-header">
          <div className="legacy-mobile-header-row">
            <div className="legacy-brand compact">
              <Image src="/purple-shop-logo.png" alt="Purple Shop" width={36} height={36} />
              <strong>Purple Shop</strong>
            </div>
            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu de navegacion"
              ref={mobileToggleRef}
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="mobile-drawer-backdrop" onClick={closeMobileDrawer}>
            <nav
              className="mobile-drawer"
              aria-label="Navegacion movil"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={closeMobileDrawer}
                aria-label="Cerrar menu de navegacion"
              >
                <X size={20} />
              </button>
              {NAV_GROUPS.map((group) => (
                <div className="sidebar-group" key={group.label}>
                  <p className="sidebar-group-label">{group.label}</p>
                  {group.items.map((item) => (
                    <Link
                      className="mobile-nav-link"
                      href={item.href}
                      key={item.href}
                      onClick={closeMobileDrawer}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        )}

        <div className="legacy-main">{children}</div>
      </div>
    </div>
  );
}
