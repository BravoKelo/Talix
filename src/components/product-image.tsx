"use client";
import { useState } from "react";
import Image from "next/image";
import { displayImageUrl } from "@/lib/demo-image";
import type { Product } from "@/lib/types";
export function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  return product.image_url && !failed ? (
    <Image
      width={720}
      height={540}
      unoptimized
      className="shop-product-image"
      src={displayImageUrl(product.image_url)}
      alt={product.name}
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className="shop-product-image shop-image-placeholder"
      role="img"
      aria-label={`No image available for ${product.name}`}
    >
      <span aria-hidden="true">◇</span>
      <span>No image available</span>
    </div>
  );
}
