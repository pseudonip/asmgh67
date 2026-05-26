import { createSignal } from "solid-js"

export default function AdminDig() {
  const [domain, setDomain] = createSignal<string>("");
  const [output, setOutput] = createSignal<string>("");

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="mb-4">
        <h1 class="text-2xl ml-1 leading-none font-semibold">Dig</h1>
        <p class="text-sm text-muted-foreground ml-1 mt-1">
          Dig a domain for testing
        </p>
      </div>

      <div class="rounded-lg border bg-card p-2 px-4 flex-1">
        {output()}
      </div>
    </main>
  )
}
