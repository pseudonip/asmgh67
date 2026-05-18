import { createResource, Show } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { LayoutDashboard, Server } from "lucide-solid";
import Nav from "~/components/Nav";
import DomainSwitcher from "~/components/DomainSwitcher";
import { getUserZones } from "~/lib/server/zones";

export default function AdminLayout(props: { children: Node }) {
  const location = useLocation();

  const [zones] = createResource(async () => {
    return getUserZones();
  });

  return (
    <div class="h-screen flex">
      <Show when={location.pathname != "/app/zones/new"}>
        <div class="w-50 border-r transition-all duration-300">
          <div class="p-2">
            <DomainSwitcher domains={zones()?.map((z) => z.name) ?? []} />
          </div>

          <hr />

          <Show when={location.pathname.startsWith("/app/zones/")}>
            <Nav
              links={[
                {
                  title: "Overview",
                  icon: LayoutDashboard,
                  variant: location.pathname === `/app/zones/${location.pathname.split("/")[3]}` ? "default" : "ghost",
                  url: `/app/zones/${location.pathname.split("/")[3]}`,
                },
              ]}
            />
          </Show>
        </div>
      </Show>

      <main class="flex-1 overflow-auto">{props.children}</main>
    </div>
  );
}
