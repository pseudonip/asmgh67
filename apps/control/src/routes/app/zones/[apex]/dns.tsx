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
import { createSignal, Show } from "solid-js";
import { RecordData } from "~/lib/server/db/schema";
import { Button } from "~/components/ui/button";
import { createRecord } from "~/lib/server/records";

export default function ZoneDNS() {
  const navigate = useNavigate();
  const zoneData = useZone();

  const [rName, setRName] = createSignal("");
  const [rType, setRType] = createSignal("A");
  const [rData, setRData] = createSignal<RecordData>();
  const [error, setError] = createSignal<string>("");

  if (zoneData()?.status == "pending") {
    return navigate("setup");
  }

  const displayValue = () => {
    if (!rData()) return "";
    if (rType() == "A") return rData()?.address;
    if (rType() == "AAAA") return rData()?.address;
    return "";
  };

  async function addRecord() {
    if (!rName() || !rData()) {
      setError("Record name and data are required");
      return;
    }

    setError("");

    try {
      await createRecord(zoneData()!.id, rName(), rType(), rData()!);

      setRName("");
      setRType("A");
      setRData(undefined);

    } catch (e) {
      setError("Failed to add record");
    }
  }

  return (
    <main class="p-4 flex flex-col h-screen">
      <h1 class="text-2xl ml-1 leading-none">Manage DNS</h1>

      <div class="rounded-lg border mt-4 p-2 px-3">
        <h2 class="text-lg">Add Record</h2>

        <p class="text-muted-foreground text-sm">
          {rName() ? (rName() == "@" ? zoneData()?.name : `${rName()}.${zoneData()?.name}`) : "[record name]"}{" "}
          will be an {rType()} record pointing to{" "}
          {displayValue().length > 0 ? displayValue() : "[target]"}
        </p>

        <div class="flex w-full gap-4 mt-4">
          <div>
            <p class="text-sm leading-none">Record type</p>

            <Select
              value={rType()}
              onChange={setRType}
              options={["A", "AAAA"]}
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

          <TextField>
            <TextFieldLabel>Record name</TextFieldLabel>
            <TextFieldInput
              value={rName()}
              onInput={(e) => setRName(e.currentTarget.value)}
            />
          </TextField>

          <Show when={rType() == "A" || rType() == "AAAA"}>
            <TextField>
              <TextFieldLabel>IPv{rType() == "A" ? "4" : "6"}</TextFieldLabel>
              <TextFieldInput
                value={rData()?.address}
                onInput={(e) => setRData({ address: e.currentTarget.value })}
              />
            </TextField>
          </Show>
        </div>

        <p class="text-sm text-ctp-red mt-2">{error()}</p>

        <Button class="mt-5 w-full mb-1" variant="outline" onClick={addRecord}>Add Record</Button>
      </div>

      <div class="rounded-lg border mt-4 h-full">kaboom</div>
    </main>
  );
}
