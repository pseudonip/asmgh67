import { useParams } from "@solidjs/router";
import { createResource } from "solid-js";
import { getZone } from "~/lib/server/zones";
import { ZoneContext } from "./[apex]/context";

export default function ApexLayout(props: { children: any }) {
  const params = useParams();

  const [zone] = createResource(() => params.apex, async (apex) => { return await getZone(apex) });

  return (
    <ZoneContext.Provider value={zone}>
      <main class="flex-1 overflow-auto">
        {props.children}
      </main>
    </ZoneContext.Provider>
  );
}
