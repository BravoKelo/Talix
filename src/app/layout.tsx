import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: "Talix — Commerce & fulfillment",
  description: "Your business, connected. Online ordering and fulfillment.",
  referrer: "no-referrer",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="wordmark">
            talix<span>•</span>
          </Link>
          <nav>
            <Link href="/workspace">Business workspace</Link>
            <span className="badge">Simulated payments</span>
          </nav>
        </header>
        {children}
        <footer>
          Talix Core · Business-neutral commerce · No real payments
        </footer>
      </body>
    </html>
  );
}
