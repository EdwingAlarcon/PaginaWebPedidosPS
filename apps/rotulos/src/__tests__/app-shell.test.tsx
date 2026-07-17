import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/pedidos" }));
vi.mock("@/components/user-menu", () => ({ UserMenu: () => <div>UserMenu</div> }));
vi.mock("@/components/sync-status", () => ({ SyncStatus: () => <div>SyncStatus</div> }));

describe("AppShell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("marca como activo el enlace de la ruta actual", () => {
    render(
      <AppShell>
        <div>contenido</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveClass("active");
  });

  it("muestra el titulo y la descripcion contextual de la pagina en el topbar", () => {
    render(
      <AppShell>
        <div>contenido</div>
      </AppShell>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Consulta y gestiona los pedidos registrados",
    );
  });

  it("contrae el sidebar y persiste la preferencia en localStorage", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <div>contenido</div>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: /contraer menu/i }));

    expect(localStorage.getItem("purpleshop.sidebar-collapsed")).toBe("true");
    expect(screen.getByRole("button", { name: /expandir menu/i })).toBeInTheDocument();
  });

  it("abre el drawer movil, lo cierra con Escape y devuelve el foco al boton que lo abrio", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <div>contenido</div>
      </AppShell>,
    );

    const openBtn = screen.getByRole("button", { name: /abrir menu de navegacion/i });
    await user.click(openBtn);
    expect(screen.getByRole("navigation", { name: /navegacion movil/i })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("navigation", { name: /navegacion movil/i })).not.toBeInTheDocument();
    expect(openBtn).toHaveFocus();
  });
});
