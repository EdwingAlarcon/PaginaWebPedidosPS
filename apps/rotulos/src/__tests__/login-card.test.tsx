import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginCard } from "@/app/login/login-card";

const signInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  hasSupabaseEnv: () => true,
  createClient: () => ({ auth: { signInWithOAuth } }),
}));

describe("LoginCard", () => {
  it("invoca signInWithOAuth con el provider azure y deshabilita el boton mientras conecta", async () => {
    signInWithOAuth.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<LoginCard initialUnauthorized={false} />);

    const button = screen.getByRole("button", { name: /continuar con microsoft/i });
    await user.click(button);

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "azure",
      options: { redirectTo: expect.stringContaining("/auth/callback") },
    });
    await waitFor(() => expect(button).toBeDisabled());
  });

  it("muestra un error si el OAuth falla", async () => {
    signInWithOAuth.mockResolvedValue({ error: { message: "boom" } });
    const user = userEvent.setup();
    render(<LoginCard initialUnauthorized={false} />);

    await user.click(screen.getByRole("button", { name: /continuar con microsoft/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/no se pudo iniciar sesión/i),
    );
  });

  it("muestra el aviso de cuenta no autorizada cuando initialUnauthorized es true", () => {
    render(<LoginCard initialUnauthorized={true} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/no tiene acceso/i);
  });
});
