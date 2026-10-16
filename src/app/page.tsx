import Link from "next/link";
import { configured } from "@/lib/supabase/client";
export default function Home() {
  return (
    <main className="landing">
      <p className="eyebrow">YOUR BUSINESS, CONNECTED</p>
      <h1>
        From first click
        <br />
        to fulfilled order.
      </h1>
      <p className="lead">
        One place to manage your products, take online orders, and keep
        fulfillment moving.
      </p>
      <div className="actions">
        <Link className="button" href="/signup">
          Sign up →
        </Link>
        <Link className="button secondary" href="/login">
          Sign in
        </Link>
      </div>
      <div className="feature-grid">
        <article>
          <span>01</span>
          <h2>Your catalog</h2>
          <p>
            Manage shared products and local offerings, with flexible product
            options.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>Connected commerce</h2>
          <p>
            Let customers choose a location, place an order, and follow its
            progress.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Clear fulfillment</h2>
          <p>
            Give your team an organized queue, scoped to the locations they work
            in.
          </p>
        </article>
      </div>
      {!configured() && (
        <aside className="notice">
          Signup and ordering are temporarily unavailable. Please check back
          soon.
        </aside>
      )}
    </main>
  );
}
