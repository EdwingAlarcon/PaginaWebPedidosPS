import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductForm } from "@/components/product-form";
import { createLocalInventoryStore } from "@/lib/inventory-store";

vi.mock("@/lib/inventory-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/inventory-store")>("@/lib/inventory-store");
  return { ...actual, getInventoryStore: actual.createLocalInventoryStore };
});

describe("ProductForm", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea un producto nuevo con el formulario de alta", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<ProductForm onSaved={onSaved} />);

    await user.type(screen.getByLabelText(/nombre del producto/i), "Perfume 100ml");
    await user.type(screen.getByLabelText(/categoria/i), "perfumes");
    await user.type(screen.getByLabelText(/precio/i), "60000");
    await user.click(screen.getByRole("button", { name: /guardar producto/i }));

    await waitFor(async () => {
      const products = await createLocalInventoryStore().listProducts();
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe("PERFUME 100ML");
    });
    expect(onSaved).toHaveBeenCalled();
  });
});
