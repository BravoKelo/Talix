import Link from "next/link";
import { ResponsiveNavigation } from "@/components/responsive-navigation";
import { configured } from "@/lib/supabase/client";

const capabilities = [
  [
    "01",
    "A catalog that fits your business",
    "Bring products, images, and options together. Share offerings across locations or create something unique for a local audience.",
  ],
  [
    "02",
    "A clear path to checkout",
    "Customers choose a location, browse your offerings, and place an order through your business storefront.",
  ],
  [
    "03",
    "Every order, moving forward",
    "Give your team a location-specific order queue and keep customers informed with their own order-status page.",
  ],
  [
    "04",
    "Room for your whole team",
    "Manage users and their access, switch between locations, and keep each subscription organized in one workspace.",
  ],
];

export default function Home() {
  return (
    <main className="talix-home">
      <ResponsiveNavigation label="Explore Talix menu">
        {" "}
        <nav className="home-nav" aria-label="Explore Talix">
          <a href="#overview">Meet Talix</a>
          <a href="#capabilities">What you can do</a>
          <a href="#direction">Built to grow</a>
          <a href="#questions">Questions</a>
        </nav>
      </ResponsiveNavigation>
      <section className="home-hero" id="overview" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">YOUR BUSINESS, CONNECTED</p>
          <h1 id="home-title">
            Your next order.
            <br />
            <em>Your next opportunity.</em>
          </h1>
          <p className="home-lead">
            Turn a visit into an order, and an order into a great customer
            experience.
          </p>
          <p>
            Talix brings your online storefront, products, and fulfillment
            together, so you and your team can keep business moving.
          </p>
          <div className="actions">
            <Link className="button home-primary" href="/signup">
              Sign up →
            </Link>
            <a className="button secondary" href="#capabilities">
              Explore Talix
            </a>
          </div>
          <p className="hero-note">
            One workspace. Multiple locations. Your business at the center.
          </p>
        </div>
        <div
          className="hero-product"
          role="img"
          aria-label="Illustration of a Talix workspace with a location selector, an order queue, and a customer order-status card. Sample content."
        >
          <div className="product-orbit" />
          <div className="product-window">
            <div className="product-window-top">
              <span className="mini-wordmark">
                talix<span>•</span>
              </span>
              <span className="sample-label">WORKSPACE PREVIEW</span>
              <span className="sample-avatar">AB</span>
            </div>
            <div className="product-window-body">
              <div className="product-rail">
                <span className="rail-active">Overview</span>
                <span>Orders</span>
                <span>Products</span>
                <span>Locations</span>
                <span>Users</span>
              </div>
              <div className="product-main">
                <div className="product-greeting">
                  <div>
                    <small>YOUR WORKSPACE</small>
                    <h2>Let’s make today count.</h2>
                  </div>
                  <span className="sample-location">Main location⌄</span>
                </div>
                <div className="sample-stats">
                  <div>
                    <strong>12</strong>
                    <span>New orders</span>
                  </div>
                  <div>
                    <strong>8</strong>
                    <span>In progress</span>
                  </div>
                  <div>
                    <strong>24</strong>
                    <span>Completed</span>
                  </div>
                </div>
                <div className="sample-orders">
                  <strong>Keep things moving</strong>
                  {["#1042", "#1041", "#1040"].map((order, index) => (
                    <div className="sample-order" key={order}>
                      <span className="sample-package">▧</span>
                      <span>
                        {order}
                        <small>{index === 0 ? "Just received" : "Today"}</small>
                      </span>
                      <span
                        className={index === 0 ? "order-new" : "order-progress"}
                      >
                        {index === 0 ? "New" : "In progress"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="sample-customer-card">
            <span className="customer-check">✓</span>
            <small>YOUR CUSTOMER’S VIEW</small>
            <strong>Your order is ready!</strong>
            <span>A clear update. A happy customer.</span>
          </div>
          <p className="product-caption">
            An illustration of the Talix experience · Sample content
          </p>
        </div>
      </section>
      <div className="home-value-strip">
        <span>
          <b>Connect</b> your storefront and team
        </span>
        <span>
          <b>Organize</b> orders across locations
        </span>
        <span>
          <b>Grow</b> with your business in mind
        </span>
      </div>
      <section
        className="home-section"
        id="capabilities"
        aria-labelledby="capabilities-title"
      >
        <div className="section-heading">
          <p className="eyebrow">FROM FIRST CLICK TO FULFILLED ORDER</p>
          <h2 id="capabilities-title">
            Less jumping between tasks.
            <br />
            More moving forward.
          </h2>
          <p>
            Your customers see a simple way to order. Your team sees what needs
            to happen next.
          </p>
        </div>
        <div className="home-capabilities">
          {capabilities.map(([number, title, description]) => (
            <article key={number}>
              <span className="capability-number">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="home-workflow" aria-labelledby="workflow-title">
        <div className="home-section">
          <div className="section-heading">
            <p className="eyebrow">A CONNECTED EXPERIENCE</p>
            <h2 id="workflow-title">
              From your storefront
              <br />
              to your team.
            </h2>
          </div>
          <ol>
            <li>
              <span>1</span>
              <h3>Make it yours</h3>
              <p>
                Set your business name, introduction, and storefront accent
                color. Add your locations and products.
              </p>
            </li>
            <li>
              <span>2</span>
              <h3>Welcome an order</h3>
              <p>
                Customers select a location and order from your shared business
                website.
              </p>
            </li>
            <li>
              <span>3</span>
              <h3>Bring it all together</h3>
              <p>
                Your team manages fulfillment while customers follow their
                order’s progress.
              </p>
            </li>
          </ol>
        </div>
      </section>
      <section
        className="home-section home-direction"
        id="direction"
        aria-labelledby="direction-title"
      >
        <div>
          <p className="eyebrow">
            YOUR BUSINESS TODAY. YOUR POSSIBILITIES TOMORROW.
          </p>
          <h2 id="direction-title">
            A shared foundation.
            <br />
            Room to do business your way.
          </h2>
          <p>
            We’re starting with restaurants as our first audience, with a
            broader vision: Talix for many kinds of businesses.
          </p>
          <p>
            The core connects ordering and fulfillment. Planned
            business-specific modules will shape how each industry uses Talix,
            while integrations will give owners more choice in the tools they
            use.
          </p>
        </div>
        <aside className="home-roadmap">
          <span className="roadmap-label">LOOKING AHEAD</span>
          <h3>More possibilities, built around you.</h3>
          {[
            "Industry-specific tools",
            "Inventory and materials",
            "Financial reports",
            "Connections to your favorite tools",
          ].map((item) => (
            <div key={item}>
              <strong>{item}</strong>
              <span>Feature coming soon</span>
            </div>
          ))}
          <p>These capabilities are planned and are not available yet.</p>
        </aside>
      </section>
      <section
        className="home-section home-questions"
        id="questions"
        aria-labelledby="questions-title"
      >
        <div className="section-heading">
          <p className="eyebrow">A FEW THINGS TO KNOW</p>
          <h2 id="questions-title">Start with a clear picture.</h2>
        </div>
        <div className="home-faq">
          <details>
            <summary>Can I manage more than one location?</summary>
            <p>
              Yes. A subscription can cover multiple locations of the same
              business type. Your team can switch between the locations they
              have permission to access.
            </p>
          </details>
          <details>
            <summary>What if I run different kinds of businesses?</summary>
            <p>
              Your account can have multiple subscriptions, with one business
              type selected for each subscription. Industry-specific tools are
              still being developed.
            </p>
          </details>
          <details>
            <summary>Will I be charged when I try Talix?</summary>
            <p>
              Talix is in early development. The signup experience currently
              uses sample plans and pricing. Payments are simulated; no money is
              collected and no card details are required.
            </p>
          </details>
          <details>
            <summary>Can I use tools I already rely on?</summary>
            <p>
              That’s part of the Talix vision. Integrations are planned so you
              can choose an external tool in place of a built-in Talix tool, and
              switch back when you need to. Feature coming soon.
            </p>
          </details>
        </div>
      </section>
      <section className="home-final">
        <p className="eyebrow">LET’S GET YOUR BUSINESS CONNECTED</p>
        <h2>Your next chapter starts here.</h2>
        <p>
          Explore a simpler way to bring your online orders and your team
          together.
        </p>
        <Link className="button home-primary" href="/signup">
          Create your Talix account →
        </Link>
        <p className="home-returning">
          Already with us? <Link href="/login">Sign in</Link>
        </p>
      </section>
      <a className="back-to-top" href="#page-top" aria-label="Back to top">
        ↑ <span>Back to top</span>
      </a>
      {!configured() && (
        <aside className="notice home-availability">
          Signup and ordering are temporarily unavailable. Please check back
          soon.
        </aside>
      )}
    </main>
  );
}
