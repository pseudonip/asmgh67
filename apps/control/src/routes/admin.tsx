import { createSignal } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { LayoutDashboard, Server } from "lucide-solid";
import Nav from "~/components/Nav";

export default function AdminLayout(props: { children: Node }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  return (
    <div class="h-screen flex">
      <div class="w-50 border-r transition-all duration-300">
        <Nav
          isCollapsed={isCollapsed()}
          links={[
            {
              title: "Overview",
              icon: LayoutDashboard,
              variant: location.pathname === "/admin" ? "default" : "ghost",
              url: "/admin",
            },
            {
              title: "Nameservers",
              icon: Server,
              variant: location.pathname.startsWith("/admin/ns")
                ? "default"
                : "ghost",
              url: "/admin/ns",
            },
          ]}
        />
      </div>
      <main class="flex-1 overflow-auto">{props.children}</main>
    </div>
  );
}
