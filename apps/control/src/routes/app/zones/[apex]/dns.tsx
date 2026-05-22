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
import { createRecord, getZoneRecords } from "~/lib/server/records.actions";
import {
  ColumnDef,
  createSolidTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/solid-table";
import { Plus } from "lucide-solid";

export const columns: ColumnDef<Omit<Record, "auth_token_hash">>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "data",
    header: "Data",
  },
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
  });

  onMount(async () => {
    try {
      setRecords(
        (await getZoneRecords(zoneData()!.id)).sort((a, b) =>
          a.name.localeCompare(b.name),
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
      setError("Record name and data are required");
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

      <div class="rounded-xl border border-border bg-card p-4.5 mt-4">
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
            <TextFieldLabel>Record name</TextFieldLabel>
            <TextFieldInput
              value={rName()}
              onInput={(e) => setRName(e.currentTarget.value)}
              class="font-mono! lowercase"
              placeholder="@ or subdomain"
            />
          </TextField>

          <div class="w-full">
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

      <div class="rounded-lg border mt-4 h-full">
        <Table>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <tr key={headerGroup.id}>
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <th
                        key={header.id}
                        class="h-10 px-2 text-left align-middle"
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
                          class="transition-colors group-hover:bg-muted/50"
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
