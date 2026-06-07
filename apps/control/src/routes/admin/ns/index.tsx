import { ColumnDef } from "@tanstack/solid-table";
import { A, createAsync } from "@solidjs/router";
import { Button } from "~/components/ui/button";
import { Nameserver } from "~/lib/server/db/schema";
import { getNameservers } from "~/lib/server/ns.actions";
import Table from "~/components/Table";

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
  {
    accessorKey: "ok",
    header: "Status",
    cell: (info) => {
      const ok = info.getValue();

      return ok ? (
        <span class="text-xs text-ctp-green p-1 px-3 rounded-full bg-ctp-green/10">
          Online
        </span>
      ) : (
        <span class="text-xs text-ctp-red p-1 px-3 rounded-full bg-ctp-red/10">
          Offline
        </span>
      );
    },
  },
];

export default function AdminNs() {
  const nameservers = createAsync(getNameservers);

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="flex mb-4">
        <div>
          <h1 class="text-2xl ml-1 leading-none my-auto font-semibold">
            Nameservers
          </h1>

          <p class="text-sm text-muted-foreground ml-1 mt-1">
            Raincloud name servers
          </p>
        </div>

        <Button as={A} href="/admin/ns/add" class="ml-auto btn">
          Add Nameserver
        </Button>
      </div>

      <Table
        columns={columns}
        data={nameservers() ?? []}
        noEntriesMessage="No nameservers found"
      />
    </main>
  );
}
