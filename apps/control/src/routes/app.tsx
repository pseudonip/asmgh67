import { createResource, Show } from "solid-js";
import { useLocation } from "@solidjs/router";
import { getUserZones } from "~/lib/server/zones.actions";
import Sidebar from "~/components/Sidebar";

export default function AdminLayout(props: { children: Node }) {
  const location = useLocation();

  const [zones] = createResource(async () => {
    return getUserZones();
  });

  return (
    <div class="h-screen flex">
      <Show when={location.pathname != "/app/zones/new"}>
        <Sidebar
          domains={zones()?.map((z) => z.name) ?? []}
          zone={location.pathname.split("/")[3]}
        />
      </Show>

      <main class="flex-1 overflow-auto">{props.children}</main>
    </div>
  );
}
