import { useNavigate } from "@solidjs/router";
import { useZone } from "./context";
import { createEffect, Show } from "solid-js";

export default function Zone() {
  const navigate = useNavigate();
  const zoneData = useZone();

  createEffect(() => {
    if (zoneData()?.status == "pending") {
      return navigate("setup");
    }
  });

  return (
    <main class="p-4 px-5 flex flex-col h-screen">
      <div>
        <div class="flex">
          <h1 class="text-2xl leading-none font-semibold">
            {zoneData()?.name}
          </h1>

          <Show when={zoneData()?.status == "active"}>
            <span class="text-sm text-ctp-green p-1 px-3 rounded-full bg-ctp-green/10 ml-auto">
              Active
            </span>
          </Show>

          <Show when={zoneData()?.status == "error"}>
            <span class="text-sm text-ctp-red p-1 px-3 rounded-full bg-ctp-red/10 ml-auto">
              Error
            </span>
          </Show>
        </div>
        <p class="text-sm text-muted-foreground mt-1">Zone overview</p>
      </div>
    </main>
  );
}
