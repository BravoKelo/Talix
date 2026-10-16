import Link from "next/link";

export function AccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="access-layout">
      <div className="access-links" aria-label="Explore Talix">
        {["Pricing", "Products & services", "Resources"].map((label) => (
          <div key={label}>
            <strong>{label}</strong>
            <span className="coming-soon">Feature coming soon</span>
          </div>
        ))}
      </div>
      <div className="access-content">
        {children}
        <section className="access-notices" aria-label="Business resources">
          <div>
            <span className="resource-icon" aria-hidden="true">
              ↗
            </span>
            <h2>Here when you need us</h2>
            <p>Support resources</p>
            <span className="coming-soon">Feature coming soon</span>
          </div>
          <div>
            <h2>Talix updates</h2>
            <p>Announcements and service notices</p>
            <span className="coming-soon">Feature coming soon</span>
          </div>
        </section>
      </div>
      <aside className="access-feature">
        <p className="eyebrow">YOUR BUSINESS, CONNECTED</p>
        <h2>
          More time for
          <br />
          what you do best.
        </h2>
        <p>Your products. Your people. Every order, moving forward.</p>
        <div className="access-illustration" aria-hidden="true">
          <div className="illustration-card">
            <span>YOUR WORKSPACE</span>
            <strong>A little more clarity.</strong>
            <div className="illustration-line" />
            <div className="illustration-line short" />
            <div className="illustration-order">
              ● &nbsp; Order received <b>→</b>
            </div>
            <div className="illustration-order">
              ● &nbsp; Ready to go <b>✓</b>
            </div>
          </div>
          <div className="illustration-seal">
            Made for
            <br />
            <strong>your business.</strong>
          </div>
        </div>
        <div className="feature-story">
          <p className="eyebrow">GET TO KNOW TALIX</p>
          <h3>A space to learn and grow</h3>
          <p>Business stories, guides and training videos.</p>
          <span className="coming-soon">Feature coming soon</span>
        </div>
        <p className="access-footnote">
          New here? <Link href="/signup">Make Talix yours →</Link>
        </p>
      </aside>
    </div>
  );
}
