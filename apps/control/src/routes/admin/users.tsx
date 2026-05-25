import { ColumnDef } from "@tanstack/solid-table";
import { User } from "lucide-solid";
import { createSignal, onMount } from "solid-js";
import Table from "~/components/Table";
import { getAllUsers } from "~/lib/server/admin.actions";
import { User as UserSchema, Zone } from "~/lib/server/db/schema";

export const columns: ColumnDef<Zone>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: (info) => {
      const user = info.row.original;

      return (
        <div class="flex">
          <User class="w-4 h-4 my-auto mr-2 text-muted-foreground" />
          {user.id}
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
];

export default function AdminZones() {
  const [users, setUsers] = createSignal<UserSchema[]>([]);

  onMount(async () => {
    setUsers(await getAllUsers());
  });

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="mb-4">
        <h1 class="text-2xl ml-1 leading-none font-semibold">Users</h1>
        <p class="text-sm text-muted-foreground ml-1 mt-1">
          All zones on raincloud
        </p>
      </div>

      <Table
        columns={columns}
        data={users()}
        noEntriesMessage="No users found"
      />
    </main>
  );
}
