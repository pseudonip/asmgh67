import { useNavigate, useParams } from "@solidjs/router";
import { createResource } from "solid-js";
import { getZone } from "~/lib/server/zones";
import { ZoneContext } from "./[apex]/context";

export default function ApexLayout(props: { children: any }) {
  const params = useParams();
  const navigate = useNavigate();

  const [zone] = createResource(() => params.apex, async (apex) => {
    const zone = await getZone(apex);

    if (!zone) {
      navigate("/app");
      return;
    }

    return zone;
  });

  return (
    <ZoneContext.Provider value={zone}>
      <main class="flex-1 overflow-auto">
        {props.children}
      </main>
    </ZoneContext.Provider>
  );
}
