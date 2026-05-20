import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { Show } from "solid-js/web";
import { addNameserver } from "~/lib/server/ns";

export default function AddNs() {
  const [hostname, setHostname] = createSignal("");
  const [ipv4, setIpv4] = createSignal("");
  const [pool, setPool] = createSignal("");

  const [error, setError] = createSignal("");
  const [token, setToken] = createSignal("");

  async function addNs() {
    console.log(
      "Adding nameserver with hostname:",
      hostname(),
      "IPv4:",
      ipv4(),
      "Pool:",
      pool(),
    );

    setError("");

    if (!hostname() || !ipv4() || !pool()) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setToken(await addNameserver(hostname(), ipv4(), pool()));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    }
  }

  return (
    <main class="w-full h-screen flex px-2">
      <div class="m-auto w-full lg:w-1/3">
        <Card>
          <CardHeader class="space-y-1">
            <CardTitle class="text-2xl">Add Nameserver</CardTitle>
          </CardHeader>

          <CardContent class="grid gap-4">
            <TextField class="grid gap-2">
              <TextFieldLabel>Hostname</TextFieldLabel>
              <TextFieldInput
                type="text"
                placeholder="ns1.example.com"
                value={hostname()}
                onInput={(e) => setHostname(e.currentTarget.value)}
              />
            </TextField>
            <TextField class="grid gap-2">
              <TextFieldLabel>IPv4 Address</TextFieldLabel>
              <TextFieldInput
                type="text"
                placeholder="1.1.1.1"
                value={ipv4()}
                onInput={(e) => setIpv4(e.currentTarget.value)}
              />
            </TextField>
            <TextField class="grid gap-2">
              <TextFieldLabel>Pool</TextFieldLabel>
              <TextFieldInput
                type="text"
                placeholder="default"
                value={pool()}
                onInput={(e) => setPool(e.currentTarget.value)}
              />
            </TextField>

            <p class="text-sm text-ctp-red -mb-2">{error()}</p>
          </CardContent>

          <CardFooter class="flex flex-col min-w-0 overflow-hidden">
            <Button class="w-full" onClick={addNs}>
              Add Nameserver
            </Button>

            <Show when={token()}>
              <div class="mt-4 p-4 border border-ctp-green text-ctp-green rounded w-full">
                <p class="font-medium">
                  Nameserver added! Authentication token:
                </p>
                <code class="block overflow-x-auto text-sm bg-ctp-mantle border rounded-md p-1 mt-1">
                  {token()}
                </code>
              </div>
            </Show>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
