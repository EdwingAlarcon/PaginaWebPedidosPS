import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SyncStatus } from "@/components/sync-status";

describe("SyncStatus", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("muestra 'Todo al dia' cuando hay conexion", async () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });

    render(<SyncStatus />);

    await waitFor(() => expect(screen.getByText("Todo al dia")).toBeInTheDocument());
  });

  it("muestra 'Sin conexion' cuando el navegador esta offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    render(<SyncStatus />);

    await waitFor(() => expect(screen.getByText("Sin conexion")).toBeInTheDocument());
  });

  it("reacciona al evento offline en tiempo real", async () => {
    render(<SyncStatus />);
    await waitFor(() => expect(screen.getByText("Todo al dia")).toBeInTheDocument());

    window.dispatchEvent(new Event("offline"));

    await waitFor(() => expect(screen.getByText("Sin conexion")).toBeInTheDocument());
  });
});
