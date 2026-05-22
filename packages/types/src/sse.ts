import { RecordData } from "./records";

export type SerializedRecord = {
  name: string;
  type: string;
  data: RecordData;
  ttl: number;
};

export type SerializedZone = {
  name: string;
  serial: number;
  records: Record<string, SerializedRecord[]>;
  ns: string[];
};

export type ServerEventMap = {
  updateZone: SerializedZone;
  deleteZone: { name: string };
};

export type ServerEventName = keyof ServerEventMap;
