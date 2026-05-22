import { useLocation } from "@solidjs/router";
import { Globe, Home, List } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { cn } from "~/lib/utils";
import DomainSwitcher from "./DomainSwitcher";
import Nav from "./Nav";

interface SidebarProps {
  domains: string[];
  zone?: string;
  admin?: boolean;
}

export default function Sidebar(props: SidebarProps) {
  const [collapsed, setCollapsed] = createSignal(false);
  const location = useLocation();

  const variant = (match: (path: string) => boolean) =>
    match(location.pathname) ? ("default" as const) : ("ghost" as const);

  const workspaceLinks = () => [
    {
      title: "Zones",
      url: "/app",
      icon: Globe,
      variant: variant((path) => path === "/app"),
    },
  ];

  const zoneLinks = (domain: string) => [
    {
      title: "Overview",
      url: `/app/zones/${domain}`,
      icon: Home,
      variant: variant((p) => p === `/app/zones/${domain}`),
    },
    {
      title: "DNS Records",
      url: `/app/zones/${domain}/dns`,
      icon: List,
      variant: variant((p) => p === `/app/zones/${domain}/dns`),
    },
  ];

  const adminLinks = () => [
    {
      title: "Overview",
      url: "/admin",
      icon: Home,
      variant: variant((p) => p === "/admin"),
    },
  ];

  return (
    <aside
      data-collapsed={collapsed()}
      class={cn(
        "flex flex-col gap-1 border-r border-sidebar-border bg-sidebar text-sidebar-foreground p-2 px-3",
        "transition-[width] duration-150",
        collapsed() ? "w-14" : "w-60",
      )}
    >
      <div class={cn("flex items-center gap-2 px-2 py-2", collapsed() && "justify-center px-0")}>
        <Show when={!collapsed()}>
          <p class="text-[15px] font-semibold tracking-light">Raincloud</p>
        </Show>
      </div>

      <Show when={!props.admin}>
        <DomainSwitcher domains={props.domains} isCollapsed={collapsed()} />
      </Show>

      <div class={cn("px-2 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground", collapsed() && "sr-only")}>
        {props.admin ? "Admin" : "Workspace"}
      </div>

      <Nav isCollapsed={collapsed()} links={props.admin ? adminLinks() : workspaceLinks()} />

      <Show when={props.zone}>
        <div class={cn("px-2 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground truncate", collapsed() && "sr-only")}>
          {props.zone}
        </div>

        <Nav isCollapsed={collapsed()} links={zoneLinks(props.zone!)} />
      </Show>
    </aside>
  );
}
