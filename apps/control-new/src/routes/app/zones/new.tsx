import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { createZone } from "~/lib/server/zones";

export default function NewZone() {
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [error, setError] = createSignal("");

  async function connectDomain() {
    setError("");

    if (!name()) {
      setError("Please enter a domain.");
      return;
    }

    try {
      await createZone(name());
      navigate(`/app/zones/${name()}/setup`);
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
            <CardTitle class="text-2xl">Connect your domain</CardTitle>
            <CardDescription>
              Enter the domain you would like to link to raincloud. You will
              recieve NS records to enter on the next step.
            </CardDescription>
          </CardHeader>

          <CardContent class="grid gap-4">
            <TextField class="grid gap-2">
              <TextFieldLabel>Domain</TextFieldLabel>
              <TextFieldInput
                type="text"
                placeholder="example.com"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
              />
            </TextField>

            <p class="text-sm text-ctp-red -mb-2">{error()}</p>
          </CardContent>

          <CardFooter class="flex flex-col min-w-0 overflow-hidden">
            <Button class="w-full" onClick={connectDomain}>
              Connect domain
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
