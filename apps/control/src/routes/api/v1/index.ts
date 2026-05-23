import { getApiUserFromRequest } from "~/lib/server/api.server";

export async function GET({ request }) {
  const user = await getApiUserFromRequest(request);

  if (!user) {
    return Response.json({
      message: "Unauthorized",
    }, { status: 401 });
  }

  return Response.json({
    message: "200 OK",
  });
}
