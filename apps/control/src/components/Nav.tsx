import type { Component, ComponentProps } from "solid-js";
import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface NavProps {
  isCollapsed: boolean;

  links: {
    title: string;
    label?: string;
    icon: Component<ComponentProps<"svg">>;
    variant: "default" | "ghost";
    url: string;
  }[];
}

export default function Nav(props: NavProps) {
  return (
    <div
      data-collapsed={props.isCollapsed}
      class="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav class="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        <For each={props.links}>
          {(link) => (
            <Show
              when={props.isCollapsed}
              fallback={
                <A
                  href={link.url}
                  class={cn(
                    buttonVariants({ variant: link.variant, size: "sm" }),
                    "justify-start btn",
                  )}
                >
                  <link.icon class="mr-2 h-4 w-4" />
                  {link.title}
                  <Show when={link.label}>
                    <span
                      class={cn(
                        "ml-auto",
                        link.variant === "default" &&
                          "text-background dark:text-muted-foreground",
                      )}
                    >
                      {link.label}
                    </span>
                  </Show>
                </A>
              }
            >
              <Tooltip placement="right">
                <TooltipTrigger>
                  <A
                    href={link.url}
                    class={cn(
                      buttonVariants({ variant: link.variant, size: "icon" }),
                      "h-9 w-9 btn",
                    )}
                  >
                    <link.icon class="h-4 w-4" />
                    <span class="sr-only">{link.title}</span>
                  </A>
                </TooltipTrigger>
                <TooltipContent class="flex items-center gap-4">
                  {link.title}
                  <Show when={link.label}>
                    <span class="ml-auto text-muted-foreground">
                      {link.label}
                    </span>
                  </Show>
                </TooltipContent>
              </Tooltip>
            </Show>
          )}
        </For>
      </nav>
    </div>
  );
}
