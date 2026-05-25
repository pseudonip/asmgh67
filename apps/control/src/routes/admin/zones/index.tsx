import { A } from "@solidjs/router";
import { ColumnDef } from "@tanstack/solid-table";
import { Globe, Plus } from "lucide-solid";
import { createSignal, onMount } from "solid-js";
import Table from "~/components/Table";
import { Button } from "~/components/ui/button";
import { Zone } from "~/lib/server/db/schema";
import { getAllZones } from "~/lib/server/admin.actions";

export const columns: ColumnDef<Zone>[] = [
  {
    accessorKey: "name",
    header: "Domain",
    cell: (info) => {
      const zone = info.row.original;

      return (
        <div class="flex">
          <Globe class="w-3 h-3 my-auto mr-2 text-muted-foreground" />

          <a
            href={
              `/admin/zones/${zone.name}`
            }
            class="text-ctp-blue hover:underline"
          >
            {zone.name}
          </a>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) => {
      switch (info.getValue()) {
        case "active":
          return (
            <span class="text-xs text-ctp-green p-1 px-3 rounded-full bg-ctp-green/10">
              Active
            </span>
          );
        case "pending":
          return (
            <span class="text-xs text-ctp-yellow p-1 px-3 rounded-full bg-ctp-yellow/10">
              Pending
            </span>
          );
        case "error":
          return (
            <span class="text-xs text-ctp-red p-1 px-3 rounded-full bg-ctp-red/10">
              Error
            </span>
          );
      }
    },
  },
];

export default function AdminZones() {
  const [zones, setZones] = createSignal<Zone[]>([]);

  onMount(async () => {
    setZones(await getAllZones());
  });

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="flex mb-4">
        <div>
          <h1 class="text-2xl ml-1 leading-none font-semibold">Zones</h1>
          <p class="text-sm text-muted-foreground ml-1 mt-1">
            All zones on raincloud
          </p>
        </div>

        <Button as={A} href="/app/zones/new" class="ml-auto btn">
          <Plus class="w-4 h-4 mr-1" />
          <p class="mb-px">New Zone</p>
        </Button>
      </div>

      <Table
        columns={columns}
        data={zones()}
        noEntriesMessage="No zones found"
      />
    </main>
  );
}
