import spec from "~/lib/openapi/spec";

export function GET() {
  return Response.json(spec);
}
