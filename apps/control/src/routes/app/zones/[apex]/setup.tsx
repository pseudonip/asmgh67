import { useZone } from "./context";

export default function ApexSetup() {
  const zoneData = useZone();

  return (
    <main class="py-2 px-4">
      <p>setup</p>
    </main>
  );
}
