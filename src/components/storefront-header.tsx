import { displayImageUrl } from "@/lib/demo-image";
import Image from "next/image";
import { StorefrontNavigation } from "./storefront-navigation";
import { designFor, headerLayout } from "@/lib/storefront-design";
import type { Location, Subscription } from "@/lib/types";

export function StorefrontHeader({
  subscription,
  children,
  search,
  preview = false,
  location,
}: {
  subscription: Partial<Subscription>;
  children: React.ReactNode;
  search?: React.ReactNode;
  preview?: boolean;
  location?: Location;
}) {
  const design = designFor(subscription);
  const centeredPhoto =
    design.header_identity === "photo" ? subscription.header_photo_url : null;
  return (
    <div
      className={`shop-nav header-nav-${headerLayout(subscription)}`}
      role={preview ? undefined : "navigation"}
      aria-label={preview ? undefined : "Storefront"}
    >
      <a
        className="shop-logo"
        href={preview ? undefined : "#shop-products"}
        aria-label={`${subscription.name} products`}
      >
        {subscription.logo_url ? (
          <Image
            width={72}
            height={56}
            unoptimized
            src={displayImageUrl(subscription.logo_url)}
            alt={`${subscription.name} logo`}
          />
        ) : (
          <span className="shop-initial" aria-hidden="true">
            {subscription.name?.slice(0, 1) || "B"}
          </span>
        )}
      </a>
      <div className="shop-centered-identity">
        {centeredPhoto ? (
          <>
            <Image
              width={300}
              height={56}
              unoptimized
              src={displayImageUrl(centeredPhoto)}
              alt={`${subscription.name || "Business"} header identity`}
            />
            {preview ? (
              <span className="sr-only">{subscription.name}</span>
            ) : (
              <h1 className="sr-only">{subscription.name}</h1>
            )}
          </>
        ) : preview ? (
          <h3>{subscription.name || "Your business"}</h3>
        ) : (
          <h1>{subscription.name}</h1>
        )}
      </div>
      <StorefrontNavigation
        subscription={subscription}
        location={location}
        preview={preview}
      />
      {search}
      {children}
    </div>
  );
}
