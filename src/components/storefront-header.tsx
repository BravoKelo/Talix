import Image from "next/image";
import { designFor } from "@/lib/storefront-design";
import type { Subscription } from "@/lib/types";

export function StorefrontHeader({
  subscription,
  children,
  search,
  preview = false,
}: {
  subscription: Partial<Subscription>;
  children: React.ReactNode;
  search?: React.ReactNode;
  preview?: boolean;
}) {
  const design = designFor(subscription);
  return (
    <div
      className={`shop-nav header-nav-${design.header_layout}`}
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
            src={subscription.logo_url}
            alt={`${subscription.name} logo`}
          />
        ) : (
          <span className="shop-initial" aria-hidden="true">
            {subscription.name?.slice(0, 1) || "B"}
          </span>
        )}
      </a>
      <div className="shop-centered-identity">
        {design.header_identity === "photo" && subscription.header_photo_url ? (
          <>
            <Image
              width={300}
              height={56}
              unoptimized
              src={subscription.header_photo_url}
              alt={subscription.name || "Business"}
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
      {search}
      {children}
    </div>
  );
}
