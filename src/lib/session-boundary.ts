export function hasSupabaseSessionCookie(
  cookies: readonly { name: string }[],
) {
  return cookies.some(
    ({ name }) => name.startsWith("sb-") && name.includes("-auth-token"),
  );
}

export function isPrivateApplicationRoute(pathname: string) {
  return [
    "/admin",
    "/auth",
    "/login",
    "/onboarding",
    "/orders",
    "/signup",
    "/workspace",
  ].some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export function needsPrivateNoStore(
  pathname: string,
  cookies: readonly { name: string }[],
) {
  return (
    isPrivateApplicationRoute(pathname) || hasSupabaseSessionCookie(cookies)
  );
}
