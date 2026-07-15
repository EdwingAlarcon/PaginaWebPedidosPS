import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LabelForm } from "@/components/label-form";

describe("LabelForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks printing and displays validation feedback for an invalid draft", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(<LabelForm />);
    fireEvent.click(screen.getByRole("button", { name: "Imprimir" }));

    expect(print).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Revisa");
  });
});
