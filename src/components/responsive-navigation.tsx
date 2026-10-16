"use client";

import { useId, useState } from "react";

export function ResponsiveNavigation({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="responsive-navigation">
      <button
        type="button"
        className="mobile-navigation-toggle secondary"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {label}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div
        id={id}
        className="responsive-navigation-content"
        data-open={open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a, button"))
            setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.currentTarget.parentElement?.querySelector("button")?.focus();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
