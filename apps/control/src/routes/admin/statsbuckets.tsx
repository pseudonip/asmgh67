import { ColumnDef } from "@tanstack/solid-table";
import { User } from "lucide-solid";
import { createResource } from "solid-js";
import Table from "~/components/Table";
import { getAllUsers, getSomeQueryStats } from "~/lib/server/admin.actions";
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
  }
];

export default function AdminStatBuckets() {
  const [stats] = createResource(getSomeQueryStats);

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="mb-4">
        <h1 class="text-2xl ml-1 leading-none font-semibold">Stat Buckets</h1>
        <p class="text-sm text-muted-foreground ml-1 mt-1">
          Latest buckets from ns logs, not great for stats tbh
        </p>
      </div>

      <Table
        columns={columns}
        data={stats() || []}
        noEntriesMessage="No stats found"
      />
    </main>
  );
}
