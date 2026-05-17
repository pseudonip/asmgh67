import { createSignal } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { LayoutDashboard, Server } from "lucide-solid";
import Nav from "~/components/Nav";
import DomainSwitcher from "~/components/DomainSwitcher";

export default function AdminLayout(props: { children: Node }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  return (
    <div class="h-screen flex">
      <div class="w-50 border-r transition-all duration-300">
        <div class="p-2">
          <DomainSwitcher domains={["example.com", "example67.net"]} />
        </div>

        <hr class="my-2" />

        <Nav
          isCollapsed={isCollapsed()}
          links={[
            {
              title: "Overview",
              icon: LayoutDashboard,
              variant: location.pathname === "/app" ? "default" : "ghost",
              url: `/app`,
            },
          ]}
        />
      </div>
      <main class="flex-1 overflow-auto">{props.children}</main>
    </div>
  );
}
