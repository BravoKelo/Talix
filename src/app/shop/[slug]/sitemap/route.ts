import { loadPublicCatalog } from "@/lib/public-catalog";
import { publicSiteOrigin } from "@/lib/website-seo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const catalog = await loadPublicCatalog(slug);
  if (!catalog?.subscription.website_live_template)
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  const url = publicSiteOrigin() + "/shop/" + encodeURIComponent(slug);
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    "<url><loc>" +
    url +
    "</loc><changefreq>daily</changefreq><priority>1.0</priority></url>" +
    "</urlset>";
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
