import type { Subscription } from "./types";
export type StorefrontDesign = {
  header_identity: "name" | "photo";
  header_background: string;
  storefront_text: string;
  storefront_button: string;
  storefront_font: "sans" | "serif" | "mono";
  storefront_text_size: "standard" | "large";
  tile_corners: "square" | "subtle" | "round";
  tile_spacing: "compact" | "comfortable";
};
export const defaultDesign: StorefrontDesign = {
  header_identity: "name",
  header_background: "#ffffff",
  storefront_text: "#17233b",
  storefront_button: "#292929",
  storefront_font: "sans",
  storefront_text_size: "standard",
  tile_corners: "square",
  tile_spacing: "comfortable",
};
export function designFor(s: Partial<Subscription>): StorefrontDesign {
  return Object.fromEntries(
    Object.entries(defaultDesign).map(([k, v]) => [
      k,
      s[k as keyof Subscription] ?? v,
    ]),
  ) as StorefrontDesign;
}
export function contrastText(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)?.map((v) => parseInt(v, 16) / 255) ?? [
    1, 1, 1,
  ];
  const luminance = rgb
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
export function storefrontStyle(s: Partial<Subscription>): React.CSSProperties {
  const d = designFor(s);
  return {
    "--shop-icon-filter":
      contrastText(d.header_background) === "#ffffff"
        ? "brightness(0) invert(1)"
        : "none",
    "--shop-header": d.header_background,
    "--shop-header-ink": contrastText(d.header_background),
    "--shop-ink": d.storefront_text,
    "--shop-button": d.storefront_button,
    "--shop-button-ink": contrastText(d.storefront_button),
    "--shop-radius": { square: "0px", subtle: "8px", round: "16px" }[
      d.tile_corners
    ],
    "--shop-gap": d.tile_spacing === "compact" ? "16px" : "24px",
    "--shop-font": {
      sans: "Arial, Helvetica, sans-serif",
      serif: "Georgia, serif",
      mono: "ui-monospace, monospace",
    }[d.storefront_font],
    "--shop-text-size": d.storefront_text_size === "large" ? "16px" : "14px",
  } as React.CSSProperties;
}
