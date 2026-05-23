import { ColumnDef } from "@tanstack/solid-table";
import { Trash } from "lucide-solid";
import { createResource, createSignal, Show } from "solid-js";
import Table from "~/components/Table";
import { Button } from "~/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field";
import { createApiKey, getApiKeys } from "~/lib/server/api.actions";

const columns: ColumnDef<{ name: string }>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "actions",
    header: "",
    cell: (info) => {
      const apiKey = info.row.original;

      return (
        <div class="flex gap-2 justify-end">
          <button
            onClick={async () => {
              try {
                //await deleteRecord(record.id);
                //info.table.options.meta?.deleteRecord(record.id);
              } catch (e) {
                console.error("Failed to delete api key:", e);
              }
            }}
            class="hover:text-ctp-red transition-all duration-300"
          >
            <Trash size={16} />
          </button>
        </div>
      );
    }
  }
];

export default function APISettings() {
  const [keys, { mutate: setKeys }] = createResource(getApiKeys);

  const [keyName, setKeyName] = createSignal("");
  const [keyToken, setKeyToken] = createSignal("");

  async function createKey() {
    if (!keyName()) return;

    try {
      const key = await createApiKey(keyName());

      setKeys((prev) => [...(prev ?? []), { id: key.id, name: keyName() }]);
      setKeyToken(key.token)
      setKeyName("");
    } catch (e) {
      console.error("Failed to create API key:", e);
    }
  }

  return (
    <main class="p-4 px-5 flex flex-col flex-1">
      <div class="flex flex-1 gap-4">
        <div class="p-4 bg-card border rounded-lg mb-4 flex w-1/2">
          <TextField class="flex-1 mr-4">
            <TextFieldLabel>API Key Name</TextFieldLabel>
            <TextFieldInput
              placeholder="My API Key"
              value={keyName()}
              onInput={(e) => setKeyName(e.currentTarget.value)}
            />
          </TextField>

          <Button onClick={createKey} class="ml-auto self-end">
            Create API Key
          </Button>
        </div>

        <Show when={keyToken()}>
          <div class="p-4 bg-card border rounded-lg mb-4 flex-col w-1/2">
            <p class="text-sm text-muted-foreground mb-2">Your new API key token. This is the only time you will be able to see it, so make sure to copy it now!</p>
            <code class="block overflow-x-auto text-sm bg-ctp-mantle border rounded-lg p-1 px-2 mt-1 font-mono!">
              {keyToken()}
            </code>
          </div>
        </Show>
      </div>

      <Table columns={columns} data={keys() ?? []} noEntriesMessage="No API keys found" />
    </main>
  );
}
