import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AllowedUsersAdmin } from "@/components/allowed-users-admin";
import { ToastProvider } from "@/components/ui/toast";

type AllowedUserRow = { email: string; created_at: string };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function renderWithToast() {
  return render(
    <ToastProvider>
      <AllowedUsersAdmin />
    </ToastProvider>,
  );
}

function mockBackend(initialUsers: AllowedUserRow[], currentUserEmail: string) {
  const users = [...initialUsers];
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (method === "GET") {
      return jsonResponse({ users, currentUserEmail });
    }
    if (method === "POST") {
      const { email } = JSON.parse(String(init?.body));
      users.push({ email, created_at: "2026-07-27T00:00:00Z" });
      return jsonResponse({ email });
    }
    if (method === "DELETE") {
      const email = decodeURIComponent(new URL(url, "http://localhost").search.slice("?email=".length));
      const index = users.findIndex((user) => user.email === email);
      if (index >= 0) users.splice(index, 1);
      return jsonResponse({ email });
    }
    throw new Error(`metodo no mockeado: ${method}`);
  });
}

describe("AllowedUsersAdmin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lista los usuarios permitidos al montar", async () => {
    mockBackend(
      [
        { email: "edwing@example.com", created_at: "2026-07-17T00:00:00Z" },
        { email: "gerente@example.com", created_at: "2026-07-18T00:00:00Z" },
      ],
      "edwing@example.com",
    );

    renderWithToast();

    expect(await screen.findByText("edwing@example.com")).toBeInTheDocument();
    expect(screen.getByText("gerente@example.com")).toBeInTheDocument();
  });

  it("agrega un email nuevo y lo muestra en la lista", async () => {
    mockBackend([], "edwing@example.com");
    renderWithToast();
    await screen.findByText("Agregar");

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "nuevo@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

    expect(await screen.findByText("nuevo@example.com")).toBeInTheDocument();
  });

  it("no permite eliminar el propio correo", async () => {
    mockBackend([{ email: "edwing@example.com", created_at: "2026-07-17T00:00:00Z" }], "edwing@example.com");

    renderWithToast();

    const row = within(await screen.findByText("edwing@example.com").then((el) => el.closest("li") as HTMLElement));
    expect(row.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
  });

  it("elimina un email ajeno tras confirmar", async () => {
    mockBackend(
      [
        { email: "edwing@example.com", created_at: "2026-07-17T00:00:00Z" },
        { email: "gerente@example.com", created_at: "2026-07-18T00:00:00Z" },
      ],
      "edwing@example.com",
    );

    renderWithToast();
    const row = within(await screen.findByText("gerente@example.com").then((el) => el.closest("li") as HTMLElement));
    fireEvent.click(row.getByRole("button", { name: "Eliminar" }));
    const confirmButtons = await screen.findAllByRole("button", { name: "Eliminar" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(screen.queryByText("gerente@example.com")).not.toBeInTheDocument());
  });
});
