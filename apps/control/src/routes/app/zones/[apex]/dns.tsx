import { useNavigate } from "@solidjs/router";
import { useZone } from "./context";

export default function ZoneDNS() {
  const navigate = useNavigate();
  const zoneData = useZone();

  if (zoneData()?.status == "pending") {
    return navigate("setup");
  }

  return <p>dns</p>;
}
