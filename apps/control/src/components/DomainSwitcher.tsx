import { createMemo, Show } from "solid-js";
import { useNavigate, useLocation } from "@solidjs/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "~/lib/utils";
import { Globe, Plus } from "lucide-solid";

const ADD_DOMAIN = "__add__";

interface DomainSwitcherProps {
  isCollapsed?: boolean;
  domains: string[];
}

export default function DomainSwitcher(props: DomainSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const current = createMemo(() => {
    const noSelection = ["/app", "/app/zones"].includes(location.pathname);
    if (noSelection) return "Select a domain";
    return (
      props.domains.find((d) =>
        location.pathname.startsWith(`/app/zones/${d}`),
      ) ?? "Select a domain"
    );
  });

  const handleChange = (value: string | null) => {
    if (!value || value === "Select a domain") return;
    if (value === ADD_DOMAIN) {
      navigate("/app/zones/new");
    } else {
      navigate(`/app/zones/${value}`);
    }
  };

  return (
    <Select
      value={current()}
      options={["Select a domain", ...props.domains, ADD_DOMAIN]}
      onChange={handleChange}
      itemComponent={(itemProps) => {
        if (itemProps.item.rawValue === "Select a domain") return null;

        return (
          <>
            <Show when={itemProps.item.rawValue === ADD_DOMAIN}>
              <hr class="my-2 border-t border-border" />
            </Show>

            <SelectItem
              item={itemProps.item}
              class={cn(
                itemProps.item.rawValue === ADD_DOMAIN &&
                  "mt-1 pt-2 text-muted-foreground",
                itemProps.item.rawValue !== ADD_DOMAIN &&
                  "font-mono text-[13px]",
              )}
            >
              {itemProps.item.rawValue === ADD_DOMAIN ? (
                <>
                  <span class="flex items-center gap-2">
                    <Plus size={16} />
                    Add domain
                  </span>
                </>
              ) : (
                <span class="flex items-center gap-2">
                  <Globe class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {itemProps.item.rawValue}
                </span>
              )}
            </SelectItem>
          </>
        );
      }}
    >
      <SelectTrigger
        aria-label="Select domain"
        class={
          props.isCollapsed
            ? "h-9 w-9 justify-center p-0 [&>svg:last-child]:hidden"
            : "h-9 w-full justify-between gap-2 px-2.5 text-[13px]"
        }
      >
        <Show when={!props.isCollapsed} fallback={<Globe class="h-4 w-4" />}>
          <SelectValue<string> class="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
            {(state) => (
              <Show
                when={state.selectedOption()}
                fallback={
                  <span class="text-muted-foreground">Select a domain</span>
                }
              >
                <Globe class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span class="truncate font-mono text-[13px]">
                  {state.selectedOption()}
                </span>
              </Show>
            )}
          </SelectValue>
        </Show>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}
