import { createSignal } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { ArrowBigLeft, LayoutDashboard, Server } from "lucide-solid";
import Nav from "~/components/Nav";
import Sidebar from "~/components/Sidebar";

export default function AdminLayout(props: { children: Node }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  return (
    <div class="h-screen flex">
      <Sidebar admin domains={[]} />
      <main class="flex-1 overflow-auto">{props.children}</main>
    </div>
  );
}
