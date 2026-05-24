import { z } from "zod";

export const recordSchemas = {
  A: z.object({ address: z.ipv4() }),
  AAAA: z.object({ address: z.ipv6() }),
  CNAME: z.object({ target: z.string().min(1) }),
  NS: z.object({ target: z.string().min(1) }),
  PTR: z.object({ target: z.string().min(1) }),
  TXT: z.object({ text: z.string() }),
  MX: z.object({
    priority: z.number().int().nonnegative(),
    target: z.string().min(1),
  }),
  SRV: z.object({
    priority: z.number().int().nonnegative(),
    weight: z.number().int().nonnegative(),
    port: z.number().int().min(1).max(65535),
    target: z.string().min(1),
  }),
  CAA: z.object({
    flags: z.number().int().min(0).max(255),
    tag: z.enum(["issue", "issuewild", "iodef"]),
    value: z.string().min(1),
  }),
};

export type RecordType = keyof typeof recordSchemas;
export const SUPPORTED_RECORD_TYPES = Object.keys(
  recordSchemas,
) as RecordType[];

export type RecordData = {
  [K in RecordType]: z.infer<(typeof recordSchemas)[K]>;
}[RecordType];

export function validateRecordData(
  type: string,
  data: unknown,
):
  | { ok: true; type: RecordType; data: RecordData }
  | { ok: false; error: string } {
  if (!(type in recordSchemas)) {
    return { ok: false, error: `Unsupported record type: ${type}` };
  }

  const schema = recordSchemas[type as RecordType];
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues.map((i) => i.message).join(", "),
    };
  }

  return {
    ok: true,
    type: type as RecordType,
    data: result.data as RecordData,
  };
}
