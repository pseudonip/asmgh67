import { useParams } from "@solidjs/router";
import { ColumnDef } from "@tanstack/solid-table";
import { createResource } from "solid-js";
import Table from "~/components/Table";
import { getZone } from "~/lib/server/admin.actions";
import { Record } from "~/lib/server/db/schema";

export const columns: ColumnDef<Record>[] = [
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "data",
    header: "Data",
  },
  {
    accessorKey: "ttl",
    header: "TTL",
  },
];

export default function AdminZones() {
  const params = useParams();

  const [data] = createResource(() => {
    return getZone(params.name!);
  });

  const recordData = () =>
    data()?.records.map((d) => {
      let data = "";

      if (d.type == "A" || d.type == "AAAA") data = d.data?.address;
      if (d.type == "CNAME" || d.type == "NS" || d.type == "PTR")
        data = d.data?.target;
      if (d.type == "TXT") data = d.data?.text;
      if (d.type == "MX")
        data = `priority = ${d.data?.priority}; target = ${d.data?.target}`;
      if (d.type == "SRV")
        data = `priority = ${d.data?.priority}; weight = ${d.data?.weight}; port = ${d.data?.port}; target = ${d.data?.target}`;
      if (d.type == "CAA")
        data = `flags = ${d.data?.flags}; tag = ${d.data?.tag}; value = ${d.data?.value}`;

      return { ...d, data };
    }) || [];

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="mb-4">
        <h1 class="text-2xl ml-1 leading-none font-semibold">
          Zone: {data()?.zone.name}
        </h1>
        <p class="text-sm text-muted-foreground ml-1 mt-1">Admin view</p>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Status</p>
          <p class="text-2xl font-semibold">{data()?.zone.status}</p>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Serial</p>
          <p class="text-2xl font-semibold">{data()?.zone.serial}</p>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Nameserver Pool</p>
          <p class="text-2xl font-semibold">{data()?.zone.nsPool}</p>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Record Count</p>
          <p class="text-2xl font-semibold">{data()?.records.length}</p>
        </div>
      </div>

      <div class="mt-4 min-h-0">
        <Table
          columns={columns}
          data={recordData()}
          noEntriesMessage="No records found"
        />
      </div>
    </main>
  );
}
