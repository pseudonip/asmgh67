import { A } from "@solidjs/router";
import { ColumnDef } from "@tanstack/solid-table";
import { Plus } from "lucide-solid";
import { createSignal, onMount } from "solid-js";
import Table from "~/components/Table";
import { Button } from "~/components/ui/button";
import { Zone } from "~/lib/server/db/schema";
import { getUserZones } from "~/lib/server/zones.actions";

export const columns: ColumnDef<Zone>[] = [
  {
    accessorKey: "name",
    header: "Domain",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];

export default function App() {
  const [zones, setZones] = createSignal<Zone[]>([]);

  onMount(async () => {
    setZones(await getUserZones());
  });

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="flex">
        <div>
          <h1 class="text-2xl ml-1 leading-none font-semibold">Zones</h1>
          <p class="text-sm text-muted-foreground ml-1 mt-1">
            Domains you have delegated to Raincloud.
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
