import {
  ColumnDef,
  createSolidTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/solid-table";
import { For, Show } from "solid-js";
import {
  Table as SolidTable,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface TableProps {
  columns: ColumnDef<any>[];
  data: any[];
  noEntriesMessage: string;
  meta?: any;
}

export default function Table(props: TableProps) {
  const table = createSolidTable({
    get data() {
      return props.data;
    },

    get columns() {
      return props.columns;
    },

    getCoreRowModel: getCoreRowModel(),

    meta: props.meta,
  });

  return (
    <div class="rounded-xl border border-border bg-card overflow-auto h-full">
      <SolidTable>
        <TableHeader>
          <For each={table.getHeaderGroups()}>
            {(headerGroup) => (
              <tr
                key={headerGroup.id}
                class="border-b border-border bg-muted/40 text-left text-[12.5px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                <For each={headerGroup.headers}>
                  {(header) => (
                    <th
                      key={header.id}
                      class="h-10 px-4 text-left align-middle"
                    >
                      {header.isPlaceholder
                        ? null
                        : header.column.columnDef.header}
                    </th>
                  )}
                </For>
              </tr>
            )}
          </For>
        </TableHeader>

        <TableBody>
          <Show
            when={table.getRowModel().rows?.length}
            fallback={
              <TableRow>
                <TableCell
                  colSpan={props.columns.length}
                  class="h-24 text-center"
                >
                  {props.noEntriesMessage}
                </TableCell>
              </TableRow>
            }
          >
            <For each={table.getRowModel().rows}>
              {(row) => (
                <TableRow key={row.id} class="group">
                  <For each={row.getVisibleCells()}>
                    {(cell) => (
                      <TableCell
                        key={cell.id}
                        class="transition-colors group-hover:bg-muted/50 px-4"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    )}
                  </For>
                </TableRow>
              )}
            </For>
          </Show>
        </TableBody>
      </SolidTable>
    </div>
  );
}
