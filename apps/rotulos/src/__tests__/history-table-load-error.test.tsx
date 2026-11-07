import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("@/lib/label-store", () => ({
  getLabelStore: () => ({ listLabels: () => Promise.reject(new Error("boom")) }),
}));

import { HistoryTable } from "@/components/history-table";

describe("HistoryTable - fallo al cargar", () => {
  it("avisa que no se pudieron cargar los rotulos en vez de mostrar el historial vacio", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ToastProvider>
        <HistoryTable labels={[]} />
      </ToastProvider>,
    );

    expect(await screen.findByText("No se pudieron cargar los rótulos")).toBeInTheDocument();
    expect(screen.queryByText("No hay rótulos todavía")).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
