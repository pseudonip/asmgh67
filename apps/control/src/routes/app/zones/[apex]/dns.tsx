import { useZone } from "./context";
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
import { createResource, createSignal, onMount, Show } from "solid-js";
import { Record } from "~/lib/server/db/schema";
import { RecordData } from "@raincloud/types/records";
import { Button } from "~/components/ui/button";
import {
  createRecord,
  deleteRecord,
  getZoneRecords,
} from "~/lib/server/records.actions";
import { ColumnDef } from "@tanstack/solid-table";
import { Plus, Trash } from "lucide-solid";
import Table from "~/components/Table";

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
          <button
            onClick={async () => {
              try {
                await deleteRecord(record.id);
                info.table.options.meta?.deleteRecord(record.id);
              } catch (e) {
                console.error("Failed to delete record:", e);
              }
            }}
            class="hover:text-ctp-red transition-all duration-300"
          >
            <Trash size={16} />
          </button>
        </div>
      );
    },
  },
];

export default function ZoneDNS() {
  const zoneData = useZone();

  const [records, { mutate: setRecords }] = createResource(
    () => zoneData()?.id,
    async (id) => {
      return (await getZoneRecords(id)).sort((a, b) => a.type.localeCompare(b.type));
    }
  );

  const data = () =>
    records()?.map((d) => {
      let data = "";

      if (d.type == "A") data = d.data?.address;
      if (d.type == "AAAA") data = d.data?.address;

      if (d.type == "CNAME") data = d.data?.target;
      if (d.type == "NS") data = d.data?.target;
      if (d.type == "PTR") data = d.data?.target;

      if (d.type == "TXT") data = d.data?.text;

      return { ...d, data };
    }) || [];

  const meta = {
    deleteRecord: (id: string) => {
      setRecords((recs) => recs?.filter((r) => r.id !== id));
    },
  };

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
      const record = await createRecord(zoneData()!.id, {
        name: rName(),
        type: rType(),
        data: rData()!,
        ttl: rTTL(),
      });

      setRName("");
      setRType("A");
      setRData(undefined);
      setRTTL("auto");

      setRecords((r) => [...(r ?? []), record]);
    } catch (e) {
      setError(
        "Failed to add record: " + (e instanceof Error ? e.message : String(e)),
      );
    }
  }

  return (
    <main class="p-4 flex flex-col h-screen">
      <h1 class="text-2xl ml-1 leading-none font-semibold">Manage DNS</h1>

      <div class="rounded-xl border border-border bg-card p-4 px-6 mt-4">
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
                  {(state) => state.selectedOption()}
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

      <Table
        columns={columns}
        data={data()}
        noEntriesMessage="No records found"
        meta={meta}
      />
    </main>
  );
}
