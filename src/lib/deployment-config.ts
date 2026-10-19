const requiredPublicAuthConfig = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

export function missingDeploymentAuthConfig(
  environment: Record<string, string | undefined> = process.env,
) {
  if (
    environment.VERCEL_ENV !== "preview" &&
    environment.VERCEL_ENV !== "production"
  ) {
    return [];
  }
  return requiredPublicAuthConfig.filter((key) => !environment[key]?.trim());
}
