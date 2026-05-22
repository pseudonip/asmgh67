import { useNavigate } from "@solidjs/router";
import { useZone } from "./context";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { createSignal, For, onMount, Show } from "solid-js";
import { Record } from "~/lib/server/db/schema";
import { RecordData } from "@raincloud/types/records";
import { Button } from "~/components/ui/button";
import { createRecord, deleteRecord, getZoneRecords } from "~/lib/server/records.actions";
import {
  ColumnDef,
  createSolidTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/solid-table";
import { Plus, Trash } from "lucide-solid";

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
  {
    id: "actions",
    header: "",
    cell: (info) => {
      const record = info.row.original;

      return (
        <div class="flex gap-2 justify-end">
          <button onClick={async () => {
            try {
              await deleteRecord(record.id);
              info.table.options.meta?.deleteRecord(record.id);
            } catch (e) {
              console.error("Failed to delete record:", e);
            }
          }} class="hover:text-ctp-red transition-all duration-300">
            <Trash size={16} />
          </button>
        </div>
      );
    }
  }
];

export default function ZoneDNS() {
  const zoneData = useZone();

  const [records, setRecords] = createSignal<Record[]>([]);

  const table = createSolidTable({
    get data() {
      return (
        records().map((d) => {
          let data = "";

          if (d.type == "A") data = d.data?.address;
          if (d.type == "AAAA") data = d.data?.address;

          if (d.type == "CNAME") data = d.data?.target;
          if (d.type == "NS") data = d.data?.target;
          if (d.type == "PTR") data = d.data?.target;

          if (d.type == "TXT") data = d.data?.text;

          return { ...d, data };
        }) || []
      );
    },

    get columns() {
      return columns;
    },

    getCoreRowModel: getCoreRowModel(),

    meta: {
      deleteRecord: (id: string) => {
        setRecords((recs) => recs.filter((r) => r.id !== id));
      }
    }
  });

  onMount(async () => {
    try {
      setRecords(
        (await getZoneRecords(zoneData()!.id)).sort((a, b) =>
          a.type.localeCompare(b.type),
        ),
      );
    } catch (e) {
      setError("Failed to load records");
    }
  });

  const [rName, setRName] = createSignal("");
  const [rType, setRType] = createSignal("A");
  const [rData, setRData] = createSignal<RecordData>();
  const [rTTL, setRTTL] = createSignal<"auto" | "5m" | "1h" | "1d">("auto");

  const [error, setError] = createSignal<string>("");

  const displayValue = () => {
    if (!rData()) return "";

    if (rType() == "A") return rData()?.address;
    if (rType() == "AAAA") return rData()?.address;

    if (rType() == "CNAME") return rData()?.target;
    if (rType() == "NS") return rData()?.target;
    if (rType() == "PTR") return rData()?.target;

    if (rType() == "TXT") return rData()?.text;

    return "";
  };

  async function addRecord() {
    if (!rName() || !rData()) {
      setError("Record name and data is required");
      return;
    }

    setError("");

    try {
      const record = await createRecord(
        zoneData()!.id,
        {
          name: rName(),
          type: rType(),
          data: rData()!,
          ttl: rTTL(),
        }
      );

      setRName("");
      setRType("A");
      setRData(undefined);
      setRTTL("auto");

      setRecords((r) => [...r, record]);
    } catch (e) {
      setError(
        "Failed to add record: " + (e instanceof Error ? e.message : String(e)),
      );
    }
  }

  return (
    <main class="p-4 flex flex-col h-screen">
      <h1 class="text-2xl ml-1 leading-none">Manage DNS</h1>

      <div class="rounded-xl border border-border bg-card p-4 pb-3 px-6 mt-4">
        <div class="flex">
          <h2 class="text-lg">Add Record</h2>

          <div class="text-muted-foreground text-sm ml-auto my-auto">
            {rName()
              ? rName() == "@"
                ? zoneData()?.name
                : `${rName()}.${zoneData()?.name}`
              : "[record name]"}{" "}
            will be an {rType()} record pointing to{" "}
            {displayValue()?.length > 0 ? displayValue() : "[target]"}
          </div>
        </div>

        <div class="flex w-full gap-4 mt-2">
          <div class="w-1/10">
              <p class="text-sm leading-none">Type</p>

            <Select
              value={rType()}
              onChange={setRType}
              options={["A", "AAAA", "CNAME", "NS", "PTR", "TXT"]}
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

          <TextField class="w-1/5">
            <TextFieldLabel>Name</TextFieldLabel>
            <TextFieldInput
              value={rName()}
              onInput={(e) => setRName(e.currentTarget.value)}
              class="font-mono! lowercase"
              placeholder="@ or subdomain"
            />
          </TextField>

          <div class="flex-1">
            <Show when={rType() == "A" || rType() == "AAAA"}>
              <TextField>
                <TextFieldLabel>IPv{rType() == "A" ? "4" : "6"}</TextFieldLabel>
                <TextFieldInput
                  value={rData()?.address}
                  onInput={(e) => setRData({ address: e.currentTarget.value })}
                  class="font-mono! lowercase"
                />
              </TextField>
            </Show>

            <Show
              when={rType() == "CNAME" || rType() == "NS" || rType() == "PTR"}
            >
              <TextField>
                <TextFieldLabel>Target</TextFieldLabel>
                <TextFieldInput
                  value={rData()?.target}
                  onInput={(e) => setRData({ target: e.currentTarget.value })}
                  class="font-mono! lowercase"
                />
              </TextField>
            </Show>

            <Show when={rType() == "TXT"}>
              <TextField>
                <TextFieldLabel>Text</TextFieldLabel>
                <TextFieldInput
                  value={rData()?.text}
                  onInput={(e) => setRData({ text: e.currentTarget.value })}
                  class="font-mono! lowercase"
                />
              </TextField>
            </Show>
          </div>

          <div class="w-1/5">
            <p class="text-sm leading-none">TTL</p>

            <Select
              value={rTTL()}
              onChange={setRTTL}
              options={["auto", "5m", "1h", "1d"]}
              class="mt-1"
              itemComponent={(itemProps) => (
                <SelectItem item={itemProps.item}>
                  {itemProps.item.rawValue == "auto"
                    ? "Automatic"
                    : itemProps.item.rawValue}
                </SelectItem>
              )}
            >
              <SelectTrigger aria-label="Record TTL">
                <SelectValue<string>>
                  {(state) =>
                    state.selectedOption()
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          <Button class="mt-auto" onClick={addRecord}>
            <Plus size={16} />
            Add Record
          </Button>
        </div>

        <p class="text-sm text-ctp-red mt-2">{error()}</p>
      </div>

      <div class="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <tr key={headerGroup.id} class="border-b border-border bg-muted/40 text-left text-[12.5px] font-medium uppercase tracking-wider text-muted-foreground">
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <th
                        key={header.id}
                        class="h-10 px-4 text-left align-middle"
                      >
                        {header.isPlaceholder
                          ? null
                          : header.column.columnDef.header}
                      </th>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </TableHeader>

          <TableBody>
            <Show
              when={table.getRowModel().rows?.length}
              fallback={
                <TableRow>
                  <TableCell colSpan={columns.length} class="h-24 text-center">
                    No records found.
                  </TableCell>
                </TableRow>
              }
            >
              <For each={table.getRowModel().rows}>
                {(row) => (
                  <TableRow key={row.id} class="group">
                    <For each={row.getVisibleCells()}>
                      {(cell) => (
                        <TableCell
                          key={cell.id}
                          class="transition-colors group-hover:bg-muted/50 px-4"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      )}
                    </For>
                  </TableRow>
                )}
              </For>
            </Show>
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
