import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("aplica el tema guardado en localStorage al montar", () => {
    localStorage.setItem("purpleshop.theme", "dark");

    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("por defecto usa tema claro si no hay preferencia guardada", () => {
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("alterna el tema al hacer click y lo persiste en localStorage", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    await user.click(screen.getByRole("button"));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("purpleshop.theme")).toBe("dark");

    await user.click(screen.getByRole("button"));

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("purpleshop.theme")).toBe("light");
  });
});
