import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoricalReportPanel } from "@/components/historical-report-panel";
import type { HistoricalReport } from "@/lib/historical-reports";

const report: HistoricalReport = {
  totalsByYear: [
    { year: "2024", orders: 2, units: 5, total: 150_000 },
    { year: "2025", orders: 3, units: 8, total: 250_000 },
  ],
  topProducts: [{ productCode: "REF-1", productName: "CAMISETA", quantity: 8, total: 200_000 }],
  topCustomers: [{ customer: "JOHANNA", orders: 2, total: 180_000 }],
  missingRefItems: [{ orderId: "order-1", productName: "SIN REF", quantity: 1 }],
  historicalRefItems: [{ orderId: "order-2", productCode: "HIST_CAMISETA", productName: "CAMISETA", quantity: 2 }],
};

describe("HistoricalReportPanel", () => {
  it("displays year totals and historical refs", () => {
    render(<HistoricalReportPanel report={report} />);

    expect(screen.getByText("Historico importado 2024/2025")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("HIST_CAMISETA")).toBeInTheDocument();
    expect(screen.getByText("SIN REF")).toBeInTheDocument();
  });
});
