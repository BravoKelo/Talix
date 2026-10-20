// Bundled demo assets must use the current deployment's protection cookie.
// Keep stored HTTPS URLs intact for persistence and image cleanup.
const demoOrigins = [
  "https://talix-git-feature-core-storefront-visual-shopping-bravokelo.vercel.app",
  "https://talix-git-feature-website-owner-onboarding-bravokelo.vercel.app",
] as const;

const bundledDemoPaths = ["/demo-retail/", "/demo-showcase/"] as const;

export function displayImageUrl(url: string): string {
  for (const origin of demoOrigins) {
    if (
      bundledDemoPaths.some((path) => url.startsWith(`${origin}${path}`))
    ) {
      return url.slice(origin.length);
    }
  }
  return url;
}
