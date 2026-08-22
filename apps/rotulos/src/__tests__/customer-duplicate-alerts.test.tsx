import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomerDuplicateAlerts } from "@/components/customer-duplicate-alerts";
import type { CustomerDuplicateCandidate } from "@/lib/customer-duplicates";
import type { Customer } from "@/lib/business-types";

function customer(id: string, fullName: string): Customer {
  return {
    id,
    fullName,
    phone: "",
    email: "",
    department: "",
    city: "",
    locality: "",
    address: "",
    neighborhood: "",
    source: "app",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

describe("CustomerDuplicateAlerts", () => {
  it("renders duplicate suggestions", () => {
    const candidate: CustomerDuplicateCandidate = {
      reason: "alias",
      primary: customer("full", "JOHANNA CICACHA"),
      duplicates: [customer("short", "JOHANNA")],
    };

    render(<CustomerDuplicateAlerts candidates={[candidate]} onReview={vi.fn()} />);

    expect(screen.getByText("Posibles clientes duplicados")).toBeInTheDocument();
    expect(screen.getByText("JOHANNA CICACHA")).toBeInTheDocument();
    expect(screen.getByText(/Revisar con JOHANNA/)).toBeInTheDocument();
    expect(screen.getByText("Alias conocido")).toBeInTheDocument();
  });

  it("renders nothing for a clean list", () => {
    const { container } = render(<CustomerDuplicateAlerts candidates={[]} onReview={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
