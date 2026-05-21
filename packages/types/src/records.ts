import { z } from "zod";

export const recordSchemas = {
  A: z.object({ address: z.ipv4() }),
  AAAA: z.object({ address: z.ipv6() }),
  CNAME: z.object({ target: z.string().min(1) }),
  NS: z.object({ target: z.string().min(1) }),
  PTR: z.object({ target: z.string().min(1) }),
  TXT: z.object({ text: z.string() }),
};

export type RecordType = keyof typeof recordSchemas;
export const SUPPORTED_RECORD_TYPES = Object.keys(recordSchemas) as RecordType[];

export type RecordData = {
  [K in RecordType]: z.infer<(typeof recordSchemas)[K]>;
}[RecordType];

export function validateRecordData(type: string, data: unknown):
  | { ok: true, type: RecordType, data: RecordData }
  | { ok: false, error: string } {
  if (!(type in recordSchemas)) {
    return { ok: false, error: `Unsupported record type: ${type}` };
  }

  const schema = recordSchemas[type as RecordType];
  const result = schema.safeParse(data);

  if (!result.success) {
    return { ok: false, error: result.error.issues.map(i => i.message).join(", ") };
  }

  return { ok: true, type: type as RecordType, data: result.data as RecordData };
}
