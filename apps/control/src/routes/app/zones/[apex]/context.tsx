import { createContext, Resource, useContext } from "solid-js";
import { Zone } from "~/lib/server/db/schema";

export const ZoneContext = createContext<Resource<Zone | undefined>>();

export function useZone() {
  const context = useContext(ZoneContext);

  if (!context) {
    throw new Error("useZone must be used within a ZoneContext.Provider");
  }

  return context;
}
