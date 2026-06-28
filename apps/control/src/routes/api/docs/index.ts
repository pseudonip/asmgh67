import html from "./scalar.html?raw"

export function GET() {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
