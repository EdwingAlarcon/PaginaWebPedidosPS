import Link from "next/link";
import { PackagePlus, Settings, Tags } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-purpleShop-paper text-purpleShop-ink">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-black/10 bg-white px-5 py-6 lg:block">
        <div className="text-xl font-bold text-purpleShop-dark">PurpleShop</div>
        <div className="mt-1 text-sm text-neutral-500">Rotulos de envio</div>
        <nav className="mt-8 grid gap-2">
          <Link className="nav-link" href="/"><Tags size={18} /> Dashboard</Link>
          <Link className="nav-link" href="/crear"><PackagePlus size={18} /> Crear rotulo</Link>
          <Link className="nav-link" href="/historial"><Tags size={18} /> Historial</Link>
          <Link className="nav-link" href="/configuracion"><Settings size={18} /> Configuracion</Link>
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="font-bold text-purpleShop-dark">PurpleShop Rotulos</div>
          <nav className="mt-3 flex gap-2 overflow-x-auto text-sm">
            <Link className="mobile-nav-link" href="/">Dashboard</Link>
            <Link className="mobile-nav-link" href="/crear">Crear</Link>
            <Link className="mobile-nav-link" href="/historial">Historial</Link>
            <Link className="mobile-nav-link" href="/configuracion">Config</Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
