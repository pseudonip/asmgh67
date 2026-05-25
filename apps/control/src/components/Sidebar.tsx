import { useLocation, useNavigate } from "@solidjs/router";
import {
  ChevronsLeft,
  ChevronsRight,
  Globe,
  Home,
  List,
  LogOut,
  Server,
  Settings,
  User,
} from "lucide-solid";
import { createResource, createSignal, onMount, Show } from "solid-js";
import { cn } from "~/lib/utils";
import DomainSwitcher from "./DomainSwitcher";
import Nav from "./Nav";
import { Button } from "./ui/button";
import { getRequestEvent } from "solid-js/web";
import { getUser, logout as serverLogout } from "~/lib/server/auth.actions";

interface SidebarProps {
  domains: string[];
  zone?: string;
  admin?: boolean;
}

async function getLocalsUser(): Promise<
  { displayName: string; email: string; isAdmin: boolean } | undefined
> {
  "use server";
  const event = getRequestEvent();

  if (!event?.locals.user) {
    const user = await getUser();

    if (user) {
      return {
        displayName: user.displayName,
        email: user.email,
        isAdmin: user.isAdmin,
      };
    } else {
      return undefined;
    }
  }

  return {
    displayName: event?.locals.user?.displayName,
    email: event?.locals.user?.email,
    isAdmin: event?.locals.user?.isAdmin,
  };
}

export default function Sidebar(props: SidebarProps) {
  const [user] = createResource(getLocalsUser);

  const [collapsed, setCollapsed] = createSignal(false);

  const navigate = useNavigate();
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
    {
      title: "Settings",
      url: "/app/settings",
      icon: Settings,
      variant: variant((p) => p.startsWith("/app/settings")),
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
    {
      title: "Nameservers",
      url: "/admin/ns",
      icon: Server,
      variant: variant((p) => p === "/admin/ns"),
    },
    {
      title: "Zones",
      url: "/admin/zones",
      icon: Globe,
      variant: variant((p) => p === "/admin/zones"),
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: User,
      variant: variant((p) => p === "/admin/users"),
    }
  ];

  async function logout() {
    await serverLogout();
    navigate("/login");
  }

  return (
    <aside
      data-collapsed={collapsed()}
      class={cn(
        "flex flex-col gap-1 border-r border-sidebar-border bg-sidebar text-sidebar-foreground p-2 px-3",
        "transition-[width] duration-150",
        collapsed() ? "w-16 items-center" : "w-52",
      )}
    >
      <div
        class={cn(
          "flex items-center gap-2 px-2 py-2",
          collapsed() ? "justify-center px-0" : "mb-2",
        )}
      >
        <Show when={!collapsed()}>
          <p class="text-[15px] font-semibold tracking-light">Raincloud</p>

          <Show
            when={user()?.isAdmin && !props.admin}
            fallback={
              <a
                href="/app"
                class="text-xs ml-auto text-muted-foreground! flex leading-none"
              >
                app
                <ChevronsRight size={12} class="ml-1 mt-[0.5px]" />
              </a>
            }
          >
            <a
              href="/admin"
              class="text-xs ml-auto text-muted-foreground! flex leading-none"
            >
              admin
              <ChevronsRight size={12} class="ml-1 mt-[0.5px]" />
            </a>
          </Show>
        </Show>
      </div>

      <Show when={!props.admin}>
        <DomainSwitcher domains={props.domains} isCollapsed={collapsed()} />
      </Show>

      <div
        class={cn(
          "px-2 pt-5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
          collapsed() && "sr-only",
        )}
      >
        {props.admin ? "Admin" : "Workspace"}
      </div>

      <Nav
        isCollapsed={collapsed()}
        links={props.admin ? adminLinks() : workspaceLinks()}
      />

      <Show when={props.zone}>
        <div
          class={cn(
            "px-2 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground truncate",
            collapsed() && "sr-only",
          )}
        >
          {props.zone}
        </div>

        <Nav isCollapsed={collapsed()} links={zoneLinks(props.zone!)} />
      </Show>

      <div class="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        class="mb-2"
        onClick={() => setCollapsed((c) => !c)}
      >
        <Show
          when={collapsed()}
          fallback={
            <span class="inline-flex items-center gap-1.5 text-xs">
              <ChevronsLeft size={13} /> Collapse
            </span>
          }
        >
          <ChevronsRight size={13} />
        </Show>
      </Button>

      <Show when={user()}>
        <div
          class={cn(
            "flex items-center gap-2 rounded-md border border-sidebar-border bg-card/60 p-2",
            collapsed() &&
              "border-transparent bg-transparent justify-center p-1",
          )}
        >
          <div class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ctp-yellow text-[11px] font-semibold text-ctp-base">
            {user()?.displayName?.charAt(0).toUpperCase()}
          </div>

          <Show when={!collapsed()}>
            <div class="flex min-w-0 flex-col leading-none gap-1">
              <p class="truncate text-[12.5px] font-semibold -mt-0.5">
                {user()?.displayName}
              </p>
              <span class="truncate text-[11px] text-muted-foreground">
                {user()?.email}
              </span>
            </div>

            <button
              class="ml-auto text-muted-foreground hover:text-foreground"
              onClick={logout}
            >
              <LogOut size={15} />
            </button>
          </Show>
        </div>
      </Show>
    </aside>
  );
}
