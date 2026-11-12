import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

type Row = { id: string; name: string; total: number };

const data: Row[] = [
  { id: "a", name: "ANA", total: 300 },
  { id: "b", name: "BEA", total: 100 },
];

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Cliente", render: (row) => row.name, sortValue: (row) => row.name },
  { key: "total", header: "Total", render: (row) => row.total, sortValue: (row) => row.total },
];

function mockViewport(mobile: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

function renderTable(onRowClick?: (row: Row) => void) {
  render(
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      emptyTitle="Vacío"
      onRowClick={onRowClick}
      mobileCard={(row) => <span>tarjeta {row.name}</span>}
    />,
  );
}

describe("DataTable en celular", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("en pantalla ancha sigue mostrando la tabla", () => {
    mockViewport(false);
    renderTable();

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("tarjeta ANA")).not.toBeInTheDocument();
  });

  it("en celular muestra tarjetas en vez de tabla y abre la fila al tocarla", async () => {
    mockViewport(true);
    const onRowClick = vi.fn();
    renderTable(onRowClick);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByText("tarjeta ANA"));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it("en celular permite ordenar con el selector", async () => {
    mockViewport(true);
    renderTable();

    await userEvent.setup().selectOptions(screen.getByLabelText("Ordenar por"), "total:asc");

    const cards = screen.getAllByText(/tarjeta/);
    expect(cards.map((card) => card.textContent)).toEqual(["tarjeta BEA", "tarjeta ANA"]);
  });
});
