import { createMiddleware } from "@solidjs/start/middleware";
import { getUser } from "./lib/server/auth";
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

    const user = await getUser();
    event.locals.user = user;

    if (url.pathname.startsWith("/app") && !user) {
      return redirect("/login");
    }

    if (url.pathname.startsWith("/admin") && (!user || !user!.isAdmin)) {
      return redirect("/login");
    }

    if (url.pathname.startsWith("/login") && user) {
      return redirect("/app");
    }
  }
});
