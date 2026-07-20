import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarList } from "@/app/(app)/reportes/page";

describe("reports page", () => {
  it("renders zero-value status bars with zero width", () => {
    render(
      <BarList
        items={[
          { label: "Pendiente", value: 0, formattedValue: "0" },
          { label: "Completado", value: 1, formattedValue: "1" },
          { label: "Cancelado", value: 0, formattedValue: "0" },
        ]}
      />,
    );

    const pendingBar = screen.getByText("Pendiente").closest("div")?.nextElementSibling?.firstElementChild;
    const completedBar = screen.getByText("Completado").closest("div")?.nextElementSibling?.firstElementChild;
    const cancelledBar = screen.getByText("Cancelado").closest("div")?.nextElementSibling?.firstElementChild;

    expect(pendingBar).toHaveStyle({ width: "0%" });
    expect(completedBar).toHaveStyle({ width: "100%" });
    expect(cancelledBar).toHaveStyle({ width: "0%" });
  });
});
