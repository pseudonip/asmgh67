import { createResource } from "solid-js";
import { getOverview } from "~/lib/server/admin.actions";

export default function Admin() {
  const [overview] = createResource(getOverview);

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="mb-4">
        <h1 class="text-2xl ml-1 leading-none font-semibold">Overview</h1>
        <p class="text-sm text-muted-foreground ml-1 mt-1">
          And stats and stuff
        </p>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="p-4 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">User Count</p>
          <p class="text-2xl font-semibold">{overview()?.userCount}</p>
        </div>

        <div class="p-4 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Zone Count</p>
          <p class="text-2xl font-semibold">{overview()?.zoneCount}</p>
        </div>

        <div class="p-4 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Record Count</p>
          <p class="text-2xl font-semibold">{overview()?.recordCount}</p>
        </div>
      </div>
    </main>
  );
}
