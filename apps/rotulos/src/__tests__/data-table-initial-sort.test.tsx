import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

type Row = { id: string; date: string };

const columns: DataTableColumn<Row>[] = [
  { key: "date", header: "Fecha", render: (row) => row.date, sortValue: (row) => row.date },
];
const data: Row[] = [
  { id: "a", date: "2025-10-01" },
  { id: "b", date: "2026-08-14" },
  { id: "c", date: "2024-02-01" },
];

function renderedDates() {
  return within(screen.getAllByRole("rowgroup")[1])
    .getAllByRole("row")
    .map((row) => row.textContent);
}

describe("DataTable initialSort", () => {
  it("orders by the business date descending on first render, not by array order", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        initialSort={{ key: "date", direction: "desc" }}
        emptyTitle="vacio"
      />,
    );
    expect(renderedDates()).toEqual(["2026-08-14", "2025-10-01", "2024-02-01"]);
  });

  it("keeps the given order when no initialSort is provided", () => {
    render(<DataTable columns={columns} data={data} getRowId={(row) => row.id} emptyTitle="vacio" />);
    expect(renderedDates()).toEqual(["2025-10-01", "2026-08-14", "2024-02-01"]);
  });
});
