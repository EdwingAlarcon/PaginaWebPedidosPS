import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsForm } from "@/components/settings-form";

describe("SettingsForm - fallo al guardar", () => {
  it("avisa que no se guardó en vez de fallar en silencio", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<SettingsForm onSave={() => Promise.reject(new Error("400"))} />);

    await user.click(screen.getByRole("button", { name: "Guardar configuración" }));

    expect(await screen.findByText(/No se pudo guardar la configuración/)).toBeInTheDocument();
    expect(screen.queryByText("Configuración guardada.")).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
