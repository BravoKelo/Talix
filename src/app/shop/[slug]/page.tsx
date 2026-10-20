import type { Metadata } from "next";
import { Storefront } from "@/components/storefront";
import { loadPublicCatalog } from "@/lib/public-catalog";
import {
  publicSiteOrigin,
  websiteDescription,
  websiteStructuredData,
} from "@/lib/website-seo";

type ShopPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: ShopPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await loadPublicCatalog(slug);
  const origin = publicSiteOrigin();
  const path = "/shop/" + slug;
  const launched = Boolean(catalog?.subscription.website_live_template);
  const title = catalog
    ? catalog.subscription.name + " | Shop, visit, and order"
    : "Business unavailable | Talix";
  const description = catalog
    ? websiteDescription(catalog)
    : "This Talix business page is not currently available.";
  const image =
    catalog?.subscription.header_photo_url ||
    catalog?.subscription.logo_url ||
    undefined;

  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: { canonical: path },
    robots: {
      index: launched,
      follow: launched,
      googleBot: { index: launched, follow: launched },
    },
    openGraph: {
      type: "website",
      url: path,
      siteName: catalog?.subscription.name || "Talix",
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function Page({ params }: ShopPageProps) {
  const { slug } = await params;
  const catalog = await loadPublicCatalog(slug);
  const launched = Boolean(catalog?.subscription.website_live_template);
  const canonical = publicSiteOrigin() + "/shop/" + encodeURIComponent(slug);
  const structuredData =
    catalog && launched ? websiteStructuredData(catalog, canonical) : null;

  return (
    <>
      <link
        rel="sitemap"
        type="application/xml"
        href={"/shop/" + encodeURIComponent(slug) + "/sitemap"}
      />
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <Storefront slug={slug} initialCatalog={catalog} />
    </>
  );
}
