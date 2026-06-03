import { useLocation } from "@solidjs/router";
import { Key, Shield } from "lucide-solid";
import Nav from "~/components/Nav";

export default function App(props: { children: any }) {
  const location = useLocation();

  const variant = (match: (path: string) => boolean) =>
    match(location.pathname) ? ("default" as const) : ("ghost" as const);

  const links = () => [
    {
      title: "Security",
      url: "/app/settings/security",
      icon: Shield,
      variant: variant((path) => path === "/app/settings/security"),
    },
    {
      title: "API Keys",
      url: "/app/settings/api",
      icon: Key,
      variant: variant((path) => path === "/app/settings/api"),
    },
  ];

  return (
    <main class="p-4 px-5 flex flex-col h-screen">
      <div>
        <h1 class="text-2xl leading-none font-semibold">Settings</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div class="flex">
        <aside class="mt-4 w-48 bg-card border rounded-xl h-fit">
          <Nav isCollapsed={false} links={links()} />
        </aside>

        {props.children}
      </div>
    </main>
  );
}
