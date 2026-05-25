import { createResource } from "solid-js";
import { LineChart } from "~/components/ui/charts";
import { getOverview } from "~/lib/server/admin.actions";

export default function Admin() {
  const [overview] = createResource(getOverview);

  const chartData = () => {
    return {
      labels: overview()?.hourlyLabels || [],

        datasets: [
          {
            label: "Queries",
            data: overview()?.hourlyPoints || [],
          }
        ],
    }
  };

  return (
    <main class="p-4 flex flex-col h-screen">
      <div class="mb-4">
        <h1 class="text-2xl ml-1 leading-none font-semibold">Overview</h1>
        <p class="text-sm text-muted-foreground ml-1 mt-1">
          And stats and stuff
        </p>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">User Count</p>
          <p class="text-2xl font-semibold">{overview()?.userCount}</p>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Zone Count</p>
          <p class="text-2xl font-semibold">{overview()?.zoneCount}</p>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Record Count</p>
          <p class="text-2xl font-semibold">{overview()?.recordCount}</p>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border">
          <p class="text-sm text-muted-foreground">Queries (last 24h)</p>
          <p class="text-2xl font-semibold">{overview()?.totalQueryCount24h}</p>
        </div>
      </div>

      <div class="flex mt-4 gap-4">
        <div class="bg-card rounded-lg p-4 px-6 border w-[74.7%]">
          <p class="text-sm text-muted-foreground ml-1 mt-1">Queries (last 24h)</p>

          <div class="h-72">
            <LineChart data={chartData()} />
          </div>
        </div>

        <div class="p-4 px-6 rounded-lg bg-card border flex-1">
          <p class="text-sm text-muted-foreground mb-2">Query Results (last 24h)</p>

          <div class="flex">
            <p>NOERROR</p>
            <p class="ml-auto">{overview()?.rcodeRows.filter(r => r.rcode === "NOERROR")[0]?.total || 0}</p>
          </div>

          <div class="flex">
            <p>FORMERR</p>
            <p class="ml-auto">{overview()?.rcodeRows.filter(r => r.rcode === "FORMERR")[0]?.total || 0}</p>
          </div>

          <div class="flex">
            <p>SERVFAIL</p>
            <p class="ml-auto">{overview()?.rcodeRows.filter(r => r.rcode === "SERVFAIL")[0]?.total || 0}</p>
          </div>

          <div class="flex">
            <p>NXDOMAIN</p>
            <p class="ml-auto">{overview()?.rcodeRows.filter(r => r.rcode === "NXDOMAIN")[0]?.total || 0}</p>
          </div>

          <div class="flex">
            <p>NOTIMP</p>
            <p class="ml-auto">{overview()?.rcodeRows.filter(r => r.rcode === "NOTIMP")[0]?.total || 0}</p>
          </div>

          <div class="flex">
            <p>REFUSED</p>
            <p class="ml-auto">{overview()?.rcodeRows.filter(r => r.rcode === "REFUSED")[0]?.total || 0}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
