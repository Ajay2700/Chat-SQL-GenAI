import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

interface ResultsTableProps {
  data: Record<string, unknown>[];
}

export function ResultsTable({ data }: ResultsTableProps) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground">No rows returned.</p>;
  }

  const columns: ColumnDef<Record<string, unknown>>[] = Object.keys(data[0]).map((key) => ({
    accessorKey: key,
    header: key,
    cell: (info) => String(info.getValue() ?? ""),
  }));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-slate-950/40">
      <div className="max-h-[340px] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-secondary/90 backdrop-blur">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-3 py-2 font-semibold uppercase tracking-wide text-slate-200">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border/70 odd:bg-slate-900/30 even:bg-slate-900/10">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
