import {
  ColumnDef,
  createSolidTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/solid-table";
import { A, createAsync } from "@solidjs/router";
import { Button } from "~/components/ui/button";
import { Nameserver } from "~/lib/server/db/schema";
import { For, Show } from "solid-js/web";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getNameservers } from "~/lib/server/ns.actions";

export const columns: ColumnDef<Omit<Nameserver, "auth_token_hash">>[] = [
  {
    accessorKey: "hostname",
    header: "Hostname",
  },
  {
    accessorKey: "ipv4",
    header: "IPv4",
  },
  {
    accessorKey: "pool",
    header: "Pool",
  },
];

export default function AdminNs() {
  const nameservers = createAsync(getNameservers);

  const table = createSolidTable({
    get data() {
      return nameservers() || [];
    },

    get columns() {
      return columns;
    },

    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="flex">
        <h1 class="text-2xl ml-2 leading-none my-auto font-semibold">Nameservers</h1>
        <Button as={A} href="/admin/ns/add" class="ml-auto btn">
          Add Nameserver
        </Button>
      </div>

      <div class="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <tr key={headerGroup.id} class="border-b border-border bg-muted/40 text-left text-[12.5px] font-medium uppercase tracking-wider text-muted-foreground">
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
                  <TableCell colSpan={columns.length} class="h-24 text-center">
                    No nameservers found.
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
        </Table>
      </div>
    </main>
  );
}
