import { createMiddleware } from "@solidjs/start/middleware";
import { getUserFromToken } from "./lib/server/auth";
import { redirect } from "@solidjs/router";

export default createMiddleware({
  onRequest: async (event) => {
    const url = new URL(event.request.url);

    if (
      url.pathname.startsWith("/_server") ||
      url.pathname.startsWith("/assets")
    ) {
      return;
    }

    const cookieHeader = event.request.headers.get("cookie") ?? "";
    const token = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/)?.[1];
    const user = token ? await getUserFromToken(token) : null;
    event.locals.user = user;

    if (url.pathname.startsWith("/app") && !user) {
      return redirect("/login");
    }

    if (url.pathname.startsWith("/admin")) {
      if (!user) return redirect("/login");
      if (!user.isAdmin) return redirect("/app");
    }

    if (url.pathname.startsWith("/login") && user) {
      return redirect("/app");
    }
  },
});
