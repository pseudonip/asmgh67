import { useNavigate } from "@solidjs/router";
import { useZone } from "./context";

export default function ApexSetup() {
  const navigate = useNavigate();
  const zoneData = useZone();

  if (zoneData()?.status == "pending") {
    return navigate("setup");
  }
}
