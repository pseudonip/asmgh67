import { createSignal } from "solid-js"
import { Button } from "~/components/ui/button";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { traceDig } from "~/lib/server/admin.actions";

export default function AdminDig() {
  const [domain, setDomain] = createSignal<string>("");
  const [output, setOutput] = createSignal<string>("");

  async function dig() {
    setOutput(await traceDig(domain()));
  }

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="mb-4">
        <h1 class="text-2xl ml-1 leading-none font-semibold">Dig</h1>
        <p class="text-sm text-muted-foreground ml-1 mt-1">
          Dig a domain for testing
        </p>
      </div>

      <div class="mb-4 rounded-lg bg-card border p-2 px-4 flex gap-4">
        <TextField class="flex-1">
          <TextFieldLabel>Domain</TextFieldLabel>
          <TextFieldInput value={domain()} onInput={(e) => setDomain(e.target.value)} />
        </TextField>

        <Button onClick={dig} class="self-end w-32">Dig</Button>
      </div>

      <div class="rounded-lg border bg-card p-2 px-4 flex-1 whitespace-pre-wrap overflow-y-auto font-mono! text-sm">
        {output()}
      </div>
    </main>
  )
}
