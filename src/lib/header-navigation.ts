import type { HeaderLink } from "./types";

export const maxHeaderLinks = 8;
export const standardHeaderLinks: HeaderLink[] = [
  { label: "Home", destination: "home", url: "" },
  { label: "Shop", destination: "shop", url: "" },
  { label: "About", destination: "about", url: "" },
  { label: "Contact", destination: "contact", url: "" },
];
export function validWebsiteUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      value.length <= 2048 &&
      /^https:\/\//i.test(value) &&
      !!url.hostname &&
      !url.username &&
      !url.password &&
      !/[\s\\]/.test(value)
    );
  } catch {
    return false;
  }
}
export function validHeaderLinks(links: HeaderLink[]) {
  return (
    links.length <= maxHeaderLinks &&
    links.every(
      (link) =>
        !!link.label.trim() &&
        link.label.length <= 32 &&
        (["home", "shop", "about", "contact", "storefront"].includes(
          link.destination,
        )
          ? link.url === ""
          : link.destination === "website" && validWebsiteUrl(link.url)),
    )
  );
}
