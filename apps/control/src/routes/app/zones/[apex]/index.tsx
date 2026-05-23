import { useNavigate } from "@solidjs/router";
import { useZone } from "./context";
import { createEffect } from "solid-js";

export default function Zone() {
  const navigate = useNavigate();
  const zoneData = useZone();

  createEffect(() => {
    if (zoneData()?.status == "pending") {
      return navigate("setup");
    }
  });

  return <main class="w-full h-screen flex px-2">zone overview</main>;
}
