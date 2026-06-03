import { ColumnDef } from "@tanstack/solid-table";
import { User } from "lucide-solid";
import { createResource } from "solid-js";
import Table from "~/components/Table";
import { getAllUsers } from "~/lib/server/admin.actions";
import { Zone } from "~/lib/server/db/schema";

export const columns: ColumnDef<Zone>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: (info) => {
      const user = info.row.original;

      return (
        <div class="flex">
          <User class="w-4 h-4 my-auto mr-2 text-muted-foreground" />

          <a
            href={`/admin/users/${user.id}`}
            class="text-ctp-blue hover:underline"
          >
            {user.id}
          </a>
        </div>
      );
    },
  },
  {
    accessorKey: "displayName",
    header: "Display Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "mfaEnabled",
    header: "2FA Status",
    cell: (info) => {
      const enabled = info.getValue();

      return enabled ? (
        <span class="text-xs text-ctp-green p-1 px-3 rounded-full bg-ctp-green/10">
          Enabled
        </span>
      ) : (
        <span class="text-xs text-ctp-yellow p-1 px-3 rounded-full bg-ctp-yellow/10">
          Disabled
        </span>
      );
    },
  },
];

export default function AdminZones() {
  const [users] = createResource(getAllUsers);

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="mb-4">
        <h1 class="text-2xl ml-1 leading-none font-semibold">Users</h1>
        <p class="text-sm text-muted-foreground ml-1 mt-1">
          All users on raincloud
        </p>
      </div>

      <Table
        columns={columns}
        data={users() || []}
        noEntriesMessage="No users found"
      />
    </main>
  );
}
