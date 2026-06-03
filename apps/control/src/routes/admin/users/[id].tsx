import { useParams } from "@solidjs/router";
import { ColumnDef } from "@tanstack/solid-table";
import { Globe } from "lucide-solid";
import { createResource } from "solid-js";
import Table from "~/components/Table";
import { adminGetUser, getZone } from "~/lib/server/admin.actions";
import { Record, Zone } from "~/lib/server/db/schema";

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
            href={`/admin/zones/${zone.name}`}
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

export default function AdminUsers() {
  const params = useParams();

  const [data] = createResource(() => {
    return adminGetUser(params.id!);
  });

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="mb-4">
        <h1 class="text-2xl ml-1 leading-none font-semibold">
          User: {data()?.user?.email}
        </h1>
        <p class="text-sm text-muted-foreground ml-1 mt-1">Admin view</p>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Display Name</p>
          <p class="text-2xl font-semibold">{data()?.user?.displayName}</p>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Email</p>
          <p class="text-2xl font-semibold">{data()?.user?.email}</p>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Zone Count</p>
          <p class="text-2xl font-semibold">{data()?.zones.length}</p>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border flex flex-col">
          <p class="text-sm text-muted-foreground">ID</p>
          <p class="font-semibold my-auto">{data()?.user?.id}</p>
        </div>
      </div>

      <div class="mt-4">
        <Table
          columns={columns}
          data={data()?.zones || []}
          noEntriesMessage="No zones found"
        />
      </div>
    </main>
  );
}
