import { useNavigate } from "@solidjs/router";
import { useZone } from "./context";

export default function Zone() {
  const navigate = useNavigate();
  const zoneData = useZone();

  if (zoneData()?.status == "pending") {
    return navigate("setup");
  }

  return <main class="w-full h-screen flex px-2"></main>;
}
