import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable, DataTableColumn } from "../data-table";

interface TestRow {
  id: string;
  name: string;
  amount: number;
}

const columns: DataTableColumn<TestRow>[] = [
  {
    key: "id",
    header: "ID",
    cell: (row) => row.id,
  },
  {
    key: "name",
    header: "Name",
    sortable: true,
    cell: (row) => row.name,
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    cell: (row) => `$${row.amount}`,
  },
];

const testData: TestRow[] = [
  { id: "row-1", name: "Settlement A", amount: 500 },
  { id: "row-2", name: "Settlement B", amount: 1500 },
];

describe("DataTable", () => {
  it("renders table data with columns", () => {
    render(<DataTable columns={columns} data={testData} />);
    expect(screen.getByText("Settlement A")).toBeInTheDocument();
    expect(screen.getByText("Settlement B")).toBeInTheDocument();
    expect(screen.getByText("$500")).toBeInTheDocument();
    expect(screen.getByText("$1500")).toBeInTheDocument();
  });

  it("handles sorting clicks when sortable is true", () => {
    const onSortChange = jest.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        sortState={{ columnKey: "name", direction: "asc" }}
        onSortChange={onSortChange}
      />
    );

    const nameHeader = screen.getByText("Name");
    fireEvent.click(nameHeader);
    expect(onSortChange).toHaveBeenCalledWith("name");
  });

  it("supports clickable rows with keyboard accessibility", () => {
    const onRowClick = jest.fn();
    render(<DataTable columns={columns} data={testData} onRowClick={onRowClick} />);

    const row = screen.getByText("Settlement A").closest("tr")!;
    expect(row).toHaveAttribute("role", "button");
    expect(row).toHaveAttribute("tabindex", "0");

    fireEvent.click(row);
    expect(onRowClick).toHaveBeenCalledWith(testData[0]);

    fireEvent.keyDown(row, { key: "Enter" });
    expect(onRowClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(row, { key: " " });
    expect(onRowClick).toHaveBeenCalledTimes(3);
  });

  it("renders empty state when data is empty", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState={{ title: "No entries", description: "Create a new entry to start" }}
      />
    );
    expect(screen.getByText("No entries")).toBeInTheDocument();
    expect(screen.getByText("Create a new entry to start")).toBeInTheDocument();
  });

  it("renders error state when error message provided", () => {
    render(<DataTable columns={columns} data={[]} error="Failed to fetch transactions" />);
    expect(screen.getByText("Failed to fetch transactions")).toBeInTheDocument();
  });
});
