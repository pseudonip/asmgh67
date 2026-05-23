import { useNavigate } from "@solidjs/router";
import { useZone } from "./context";
import { getZoneSetupStatus } from "~/lib/server/zones.actions";
import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Check, CircleDashed, X } from "lucide-solid";

export default function ZoneSetup() {
  const navigate = useNavigate();
  const zoneData = useZone();

  if (zoneData() && zoneData()?.status != "pending") {
    return navigate("..");
  }

  const [setupData, setSetupData] = createSignal<any>(null);

  createEffect(async () => {
    const status = await getZoneSetupStatus(zoneData()!.name);

    if (!status) {
      navigate("/app");
    }

    if (status!.complete) {
      navigate("..");
    }

    setSetupData(status);
  });

  async function verifyNs() {
    const btn = document.getElementById("verify-btn") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Verifying...";

    const status = await getZoneSetupStatus(zoneData()!.name);

    if (!status) {
      navigate("/app");
      return;
    }

    if (status.complete) {
      navigate("..");
    } else {
      setSetupData(status);

      btn.disabled = false;
      btn.textContent = "Verify nameservers";
    }
  }

  return (
    <main class="w-full h-screen flex px-2">
      <div class="m-auto w-full lg:w-1/3">
        <Card>
          <CardHeader class="space-y-1">
            <CardTitle class="text-2xl">Connect nameservers</CardTitle>
            <CardDescription>
              Please add the following nameservers to your domain. It may take
              some time for the changes to propagate.
            </CardDescription>
          </CardHeader>

          <CardContent class="grid gap-4">
            <p>Required records:</p>

            <div class="border rounded-lg">
              <For each={setupData()?.added}>
                {(ns: string) => (
                  <div class="px-4 py-2 border-b last:border-0 text-ctp-green flex items-center">
                    <Check class="inline-block mr-2" size={16} />
                    {ns}
                    <p class="ml-auto text-ctp-text">NS</p>
                  </div>
                )}
              </For>

              <For each={setupData()?.add}>
                {(ns: string) => (
                  <div class="px-4 py-2 border-b last:border-0 flex items-center">
                    <CircleDashed class="inline-block mr-2" size={16} />
                    {ns}
                    <p class="ml-auto">NS</p>
                  </div>
                )}
              </For>
            </div>

            <Show when={setupData()?.remove.length}>
              <p>
                These nameservers might cause conflicts and should be removed:
              </p>

              <div class="border rounded-lg">
                <For each={setupData()?.remove}>
                  {(ns: string) => (
                    <div class="px-4 py-2 border-b last:border-0 text-ctp-red flex items-center">
                      <X class="inline-block mr-2" size={16} />
                      {ns}
                      <p class="ml-auto text-ctp-text">NS</p>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </CardContent>

          <CardFooter class="flex flex-col min-w-0 overflow-hidden">
            <Button class="w-full" onClick={verifyNs} id="verify-btn">
              Verify nameservers
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
