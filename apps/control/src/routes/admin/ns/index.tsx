import {
  ColumnDef,
} from "@tanstack/solid-table";
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
];

export default function AdminNs() {
  const nameservers = createAsync(getNameservers);

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="flex">
        <h1 class="text-2xl ml-2 leading-none my-auto font-semibold">
          Nameservers
        </h1>
        <Button as={A} href="/admin/ns/add" class="ml-auto btn">
          Add Nameserver
        </Button>
      </div>

      <Table columns={columns} data={nameservers() ?? []} noEntriesMessage="No nameservers found" />
    </main>
  );
}
