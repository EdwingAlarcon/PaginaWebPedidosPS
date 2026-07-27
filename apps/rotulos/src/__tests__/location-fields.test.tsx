import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { LocationFields } from "@/components/location-fields";
import type { LocationFieldsValue } from "@/lib/location";

function Harness() {
  const [value, setValue] = useState<LocationFieldsValue>({
    department: "ANTIOQUIA",
    city: "MEDELLÍN",
    locality: "",
    neighborhood: "LAURELES",
    address: "CARRERA 45",
  });

  return <LocationFields value={value} onChange={setValue} errors={{}} prefix="test" />;
}

describe("LocationFields", () => {
  it("clears dependent fields when department changes", async () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText("Departamento"), { target: { value: "VALLE DEL CAUCA" } });

    await waitFor(() => expect(screen.getByLabelText("Ciudad / municipio")).toHaveValue(""));
    expect(screen.getByLabelText("Barrio / sector")).toHaveValue("");
    expect(screen.getByLabelText("Direccion")).toHaveValue("CARRERA 45");
  });

  it("uses a filtered neighborhood selector for Bogota", async () => {
    render(
      <LocationFields
        value={{
          department: "BOGOTÁ, D.C.",
          city: "BOGOTÁ. D.C.",
          locality: "KENNEDY",
          neighborhood: "",
          address: "CALLE 8",
        }}
        onChange={() => undefined}
        errors={{}}
        prefix="test"
      />,
    );

    await waitFor(() => expect(screen.getByRole("option", { name: "CASTILLA" })).toBeInTheDocument());
    expect(screen.queryByRole("option", { name: "CEDRITOS" })).not.toBeInTheDocument();
  });

  it("marks a disabled dependent select with a distinct style and explains why via hint text", () => {
    render(
      <LocationFields
        value={{ department: "", city: "", locality: "", neighborhood: "", address: "" }}
        onChange={() => undefined}
        errors={{}}
        prefix="test"
      />,
    );

    const citySelect = screen.getByLabelText("Ciudad / municipio");
    expect(citySelect).toBeDisabled();
    expect(citySelect.className).toContain("border-dashed");
    expect(screen.getByText("Selecciona primero un departamento.")).toBeInTheDocument();
  });

  it("clears the dependency hint once the blocking field is filled", async () => {
    render(<Harness />);

    const citySelect = screen.getByLabelText("Ciudad / municipio");
    expect(citySelect).not.toBeDisabled();
    expect(screen.queryByText("Selecciona primero un departamento.")).not.toBeInTheDocument();
  });
});
