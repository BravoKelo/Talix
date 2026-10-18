// Bundled demo assets must use the current deployment's protection cookie.
// Keep stored HTTPS URLs intact for persistence and image cleanup.
const demoOrigin =
  "https://talix-git-feature-core-storefront-visual-shopping-bravokelo.vercel.app";

export function displayImageUrl(url: string): string {
  const prefix = `${demoOrigin}/demo-retail/`;
  return url.startsWith(prefix) ? url.slice(demoOrigin.length) : url;
}
