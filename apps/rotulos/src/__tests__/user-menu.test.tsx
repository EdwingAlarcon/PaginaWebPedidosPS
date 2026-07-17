import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/components/user-menu";

const getUser = vi.fn();
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));
const signOut = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/supabase/client", () => ({
  hasSupabaseEnv: () => true,
  createClient: () => ({ auth: { getUser, onAuthStateChange, signOut } }),
}));

describe("UserMenu", () => {
  it("muestra el correo del usuario autenticado y sus iniciales", async () => {
    getUser.mockResolvedValue({ data: { user: { email: "vendedor@purpleshop.co" } } });

    render(<UserMenu />);

    await waitFor(() => expect(screen.getByText("vendedor@purpleshop.co")).toBeInTheDocument());
    expect(screen.getByText("VE")).toBeInTheDocument();
  });

  it("no renderiza nada si no hay usuario autenticado", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const { container } = render(<UserMenu />);

    await waitFor(() => expect(getUser).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("cierra sesion y redirige a /login al hacer click en Cerrar sesion", async () => {
    getUser.mockResolvedValue({ data: { user: { email: "vendedor@purpleshop.co" } } });
    const user = userEvent.setup();

    render(<UserMenu />);
    await waitFor(() => expect(screen.getByText("vendedor@purpleshop.co")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /cerrar sesion/i }));

    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/login");
  });
});
