import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { serverClient } from "@/lib/supabase/server";
import { configured } from "@/lib/supabase/client";
export const metadata: Metadata = {
  title: "Talix — Commerce & fulfillment",
  description: "Your business, connected. Online ordering and fulfillment.",
  referrer: "no-referrer",
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = configured()
    ? (await (await serverClient()).auth.getUser()).data.user
    : null;
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="wordmark">
            talix<span>•</span>
          </Link>
          <nav>
            {user ? (
              <Link href="/workspace" prefetch={false}>
                Business workspace
              </Link>
            ) : (
              <>
                <Link href="/login">Sign in</Link>
                <Link href="/signup">Sign up</Link>
              </>
            )}
          </nav>
        </header>
        {children}
        <footer>Talix · Your business, connected.</footer>
      </body>
    </html>
  );
}
