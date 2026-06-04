import { useZone } from "./context";
import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { deleteZone as serverDeleteZone } from "~/lib/server/zones.actions";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { useNavigate } from "@solidjs/router";

export default function App(props: { children: any }) {
  const navigate = useNavigate();
  const zoneData = useZone();

  const [confirmZoneName, setConfirmZoneName] = createSignal("");

  async function deleteZone() {
    if (confirmZoneName() !== zoneData()?.name) return;

    try {
      await serverDeleteZone(zoneData()!.name);
      navigate("/app");
    } catch (e) {
      console.error("Failed to delete zone:", e);
    }
  }

  return (
    <main class="p-4 px-5 flex flex-col h-screen">
      <div>
        <h1 class="text-2xl leading-none font-semibold">Zone Settings</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Manage the zone settings and preferences for {zoneData()?.name}
        </p>
      </div>

      <div class="bg-card border rounded-xl mt-4">
        <div class="p-4 px-6 border-b">
          <p class="font-semibold">Delete Zone</p>
          <p class="text-sm text-ctp-red">
            This will delete your zone, all records and all data associated with
            it from Raincloud
          </p>
        </div>

        <div class="p-4 px-6 flex gap-4">
          <TextField>
            <TextFieldLabel>
              Enter the zone name{" "}
              <span class="font-bold">{zoneData()?.name}</span> to confirm
            </TextFieldLabel>
            <TextFieldInput
              value={confirmZoneName()}
              onInput={(e) => setConfirmZoneName(e.currentTarget.value)}
            />
          </TextField>

          <Button
            disabled={confirmZoneName() !== zoneData()?.name}
            onClick={deleteZone}
            class="ml-auto self-end"
            variant="destructive"
          >
            Delete Zone
          </Button>
        </div>
      </div>
    </main>
  );
}
