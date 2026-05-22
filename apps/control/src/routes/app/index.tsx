import { A } from "@solidjs/router";
import { Plus } from "lucide-solid";
import { Button } from "~/components/ui/button";

export default function App() {
  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="flex">
        <div>
          <h1 class="text-2xl ml-1 leading-none font-semibold">Zones</h1>
          <p class="text-sm text-muted-foreground ml-1 mt-1">
            Domains you have delegated to Raincloud.
          </p>
        </div>

        <Button as={A} href="/app/zones/new" class="ml-auto btn">
          <Plus class="w-4 h-4 mr-1" />
          <p class="mb-px">New Zone</p>
        </Button>
      </div>
    </main>
  );
}
