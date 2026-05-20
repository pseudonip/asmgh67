import { createMemo } from "solid-js";
import { useNavigate, useLocation } from "@solidjs/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "~/lib/utils";
import { Plus } from "lucide-solid";

const ADD_DOMAIN = "__add__";
const PLACEHOLDER = "__placeholder__";

interface DomainSwitcherProps {
  isCollapsed?: boolean;
  domains: string[];
}

export default function DomainSwitcher(props: DomainSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const current = createMemo(() => {
    const noSelection = ["/app", "/app/zones"].includes(location.pathname);
    if (noSelection) return PLACEHOLDER;
    return (
      props.domains.find((d) =>
        location.pathname.startsWith(`/app/zones/${d}`),
      ) ?? PLACEHOLDER
    );
  });

  const handleChange = (value: string | null) => {
    if (!value || value === PLACEHOLDER) return;
    if (value === ADD_DOMAIN) {
      navigate("/app/zones/new");
    } else {
      navigate(`/app/zones/${value}`);
    }
  };

  return (
    <Select
      value={current()}
      options={[PLACEHOLDER, ...props.domains, ADD_DOMAIN]}
      onChange={handleChange}
      itemComponent={(itemProps) => {
        if (itemProps.item.rawValue === PLACEHOLDER) return null;
        return (
          <SelectItem
            item={itemProps.item}
            class={cn(
              itemProps.item.rawValue === ADD_DOMAIN && "text-muted-foreground",
            )}
          >
            {itemProps.item.rawValue === ADD_DOMAIN ? (
              <span class="flex items-center gap-2">
                <Plus size={16} />
                Add domain
              </span>
            ) : (
              itemProps.item.rawValue
            )}
          </SelectItem>
        );
      }}
    >
      <SelectTrigger
        class={cn(
          "flex w-full items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate",
          props.isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
        )}
        aria-label="Select domain"
      >
        <SelectValue<string>>
          {(state) => (
            <span
              class={cn(
                "text-sm",
                props.isCollapsed && "hidden",
                state.selectedOption() === PLACEHOLDER &&
                  "text-muted-foreground",
              )}
            >
              {state.selectedOption() === PLACEHOLDER
                ? "Select a domain"
                : state.selectedOption()}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}
