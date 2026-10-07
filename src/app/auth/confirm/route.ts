import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  function destination(path: string) {
    // Relative destinations preserve the original host and never trust a caller-provided redirect.
    return new NextResponse(null, {
      status: 303,
      headers: { Location: path, "Cache-Control": "private, no-store" },
    });
  }
  const db = await serverClient();
  const code = request.nextUrl.searchParams.get("code");
  const token = request.nextUrl.searchParams.get("token_hash");
  if (code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return destination("/signup/confirmation");
  }
  if (token && request.nextUrl.searchParams.get("type") === "email") {
    const { error } = await db.auth.verifyOtp({
      token_hash: token,
      type: "email",
    });
    if (!error) return destination("/signup/confirmation");
  }
  return destination("/login?confirmation=failed&next=onboarding");
}
