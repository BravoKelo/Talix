import type { HeaderLink } from "./types";

export const maxHeaderLinks = 8;
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
        (link.destination === "storefront"
          ? link.url === ""
          : link.destination === "website" && validWebsiteUrl(link.url)),
    )
  );
}
