import { createAsync } from "@solidjs/router";
import { Key, Trash } from "lucide-solid";
import { createResource, createSignal, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import {
  createApiKey,
  deleteApiKey,
  getApiKeys,
} from "~/lib/server/api.actions";
import { getUserZones } from "~/lib/server/zones.actions";

function scopeColor(scope: string) {
  if (scope === "*:write") return "bg-ctp-red/10 text-ctp-red";

  if (scope.endsWith(":read")) return "bg-ctp-green/10 text-ctp-green";
  if (scope.endsWith(":write")) return "bg-ctp-yellow/10 text-ctp-yellow";
}

export default function APISettings() {
  const [keys, { mutate: setKeys }] = createResource(getApiKeys);
  const zones = createAsync(getUserZones);

  const [createKeyPopupOpen, setCreateKeyPopupOpen] = createSignal(false);
  const [keyName, setKeyName] = createSignal("");
  const [keyScopes, setKeyScopes] = createSignal<string[]>([]);
  const [keyToken, setKeyToken] = createSignal("");

  async function createKey() {
    if (!keyName()) return;

    try {
      const key = await createApiKey(keyName(), keyScopes());

      setKeys((prev) => [
        ...(prev ?? []),
        { id: key.id, name: keyName(), scopes: keyScopes(), tokenStart: key.token.slice(0, 16) },
      ]);
      setKeyToken(key.token);
      setKeyName("");
    } catch (e) {
      console.error("Failed to create API key:", e);
    }
  }

  async function deleteKey(id: string) {
    try {
      await deleteApiKey(id);
      setKeys((prev) => prev?.filter((key) => key.id !== id) ?? []);
    } catch (e) {
      console.error("Failed to delete API key:", e);
    }
  }

  function toggleScope(scope: string) {
    setKeyScopes((prev) => {
      if (prev.includes(scope)) {
        return prev.filter((s) => s !== scope);
      } else {
        return [...prev, scope];
      }
    });
  }

  return (
    <main class="p-4 px-5 flex flex-col flex-1">
      <div class="bg-card border rounded-xl mb-4">
        <div class="flex p-4 px-6 border-b">
          <div>
            <p class="font-semibold">Active Keys</p>
            <p class="text-sm text-muted-foreground">
              Active keys that can be used to manage your domains over the API.{" "}
              <a href="/api/docs">Read API docs</a>
            </p>
          </div>

          <Button onClick={() => setCreateKeyPopupOpen(true)} class="ml-auto self-end" variant="outline">
            Create New Key
          </Button>
        </div>

        <div class="p-4 px-6 flex gap-4 flex-col">
          <For each={keys()}>
            {(key) => (
              <div class="flex bg-muted/25 border rounded-lg p-4">
                <Key
                  class="my-auto mr-2 bg-muted p-2 rounded-lg border"
                  size={36}
                />

                <div class="ml-2 leading-none my-auto">
                  <p class="font-medium">{key.name}</p>
                  <p class="text-sm text-muted-foreground">{key.tokenStart}...</p>
                </div>

                <div class="ml-4 lg:ml-8 flex flex-wrap gap-2 items-center">
                  <For each={key.scopes}>
                    {(scope) => (
                      <span class={`text-xs p-1 px-2 rounded-md h-fit ${scopeColor(scope)}`}>
                        {scope}
                      </span>
                    )}
                  </For>
                </div>

                <Button
                  onClick={() => deleteKey(key.id)}
                  class="ml-auto self-end"
                  variant="destructive"
                  size="icon"
                >
                  <Trash size={16} />
                </Button>
              </div>
            )}
          </For>
        </div>
      </div>

      <Show when={createKeyPopupOpen()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-card border rounded-lg p-4 w-96 flex flex-col">
            <div class="flex">
              <h2 class="text-lg font-semibold">Create new API key</h2>

              <button onClick={() => setCreateKeyPopupOpen(false)} class="ml-auto">
                ✕
              </button>
            </div>

            <TextField class="flex-1 mt-4">
              <TextFieldLabel>API Key Name</TextFieldLabel>
              <TextFieldInput
                placeholder="My API Key"
                value={keyName()}
                onInput={(e) => setKeyName(e.currentTarget.value)}
              />
            </TextField>

            <div class="mt-4">
              <p class="text-sm font-medium">Scopes</p>

              <div class="mt-2 flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                <div>
                  <p class="text-xs text-muted-foreground mb-1.5">Global</p>

                  <div class="flex gap-2">
                    <button
                      onClick={() => toggleScope("*:read")}
                      class={`
                        text-xs p-1 px-2 rounded-md h-fit
                        ${keyScopes().includes("*:read") ? "bg-ctp-green/10 text-ctp-green" : "bg-ctp-mantle text-muted-foreground"}
                      `}>
                      *:read
                    </button>

                    <button
                      onClick={() => toggleScope("*:write")}
                      class={`
                        text-xs p-1 px-2 rounded-md h-fit
                        ${keyScopes().includes("*:write") ? "bg-ctp-red/10 text-ctp-red" : "bg-ctp-mantle text-muted-foreground"}
                      `}>
                      *:write
                    </button>
                  </div>
                </div>

                <Show
                  when={zones()?.length}
                  fallback={
                    <p class="text-xs text-muted-foreground">No zones</p>
                  }
                >
                  <div>
                    <p class="text-xs text-muted-foreground mb-1.5">Zones</p>

                    <div class="flex flex-col gap-2 max-h-32 overflow-y-auto">
                      <For each={zones()}>
                        {(zone) => (
                          <div class="flex items-center gap-2">
                            <span class="text-sm flex-1 truncate">
                              {zone.name}
                            </span>

                            <button
                              onClick={() => toggleScope(`${zone.name}:read`)}
                              class={`
                                text-xs p-1 px-2 rounded-md h-fit
                                ${keyScopes().includes(`${zone.name}:read`) ? "bg-ctp-green/10 text-ctp-green" : "bg-ctp-mantle text-muted-foreground"}
                              `}>
                              read
                            </button>

                            <button
                              onClick={() => toggleScope(`${zone.name}:write`)}
                              class={`
                                text-xs p-1 px-2 rounded-md h-fit
                                ${keyScopes().includes(`${zone.name}:write`) ? "bg-ctp-yellow/10 text-ctp-yellow" : "bg-ctp-mantle text-muted-foreground"}
                              `}>
                              write
                            </button>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </div>

            <Button onClick={createKey} class="mt-4">
              Create API Key
            </Button>

            <Show when={keyToken()}>
              <div class="mt-4">
                <p class="text-sm font-medium">Generated key (you will not see it again):</p>
                <div class="bg-ctp-mantle overflow-x-auto p-2 px-3 rounded-md mt-2">
                  <code class="text-xs font-mono!">{keyToken()}</code>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </main>
  );
}
