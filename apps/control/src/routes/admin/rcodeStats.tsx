import { ColumnDef } from "@tanstack/solid-table";
import { createResource, createSignal } from "solid-js";
import Table from "~/components/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getRcodeRows } from "~/lib/server/admin.actions";
import { Zone } from "~/lib/server/db/schema";

export const columns: ColumnDef<Zone>[] = [
  {
    accessorKey: "bucket",
    header: "Bucket",
  },
  {
    accessorKey: "zoneName",
    header: "Zone Name",
  },
  {
    accessorKey: "rcode",
    header: "Rcode",
  },
  {
    accessorKey: "count",
    header: "Count",
  },
];

export default function AdminRcodeStats() {
  const [rows] = createResource(getRcodeRows);
  const [category, setCategory] = createSignal<
    "NOERROR" | "FORMERR" | "SERVFAIL" | "NXDOMAIN" | "NOTIMP" | "REFUSED"
  >("NOERROR");

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="flex">
        <div class="mb-4">
          <h1 class="text-2xl ml-1 leading-none font-semibold">Rcode stats</h1>
          <p class="text-sm text-muted-foreground ml-1 mt-1">
            Latest stats based on dns rcodes
          </p>
        </div>

        <div class="ml-auto w-32">
          <Select
            value={category()}
            onChange={(value) => setCategory(value as any)}
            options={[
              "NOERROR",
              "FORMERR",
              "SERVFAIL",
              "NXDOMAIN",
              "NOTIMP",
              "REFUSED",
            ]}
            class="mt-1"
            itemComponent={(itemProps) => (
              <SelectItem item={itemProps.item}>
                {itemProps.item.rawValue}
              </SelectItem>
            )}
          >
            <SelectTrigger aria-label="Record type">
              <SelectValue<string>>
                {(state) => state.selectedOption()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
      </div>

      <Table
        columns={columns}
        data={rows()?.filter((r) => r.rcode === category()) || []}
        noEntriesMessage="No stats found"
      />
    </main>
  );
}
