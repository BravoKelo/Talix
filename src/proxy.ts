import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  hasSupabaseSessionCookie,
  needsPrivateNoStore,
} from "@/lib/session-boundary";
export async function proxy(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return NextResponse.next();
  let response = NextResponse.next({ request });
  const arrivedWithSession = hasSupabaseSessionCookie(
    request.cookies.getAll(),
  );
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([k, v]) =>
            response.headers.set(k, v),
          );
        },
      },
    },
  );
  await db.auth.getClaims();
  if (
    arrivedWithSession ||
    needsPrivateNoStore(request.nextUrl.pathname, request.cookies.getAll())
  )
    response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
