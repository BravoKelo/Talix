"use client";
import { useRef, useState } from "react";
import { maxHeaderLinks, validWebsiteUrl } from "@/lib/header-navigation";
import type { HeaderLink } from "@/lib/types";

export function HeaderLinkEditor({
  links,
  disabled,
  change,
}: {
  links: HeaderLink[];
  disabled: boolean;
  change: (links: HeaderLink[]) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const root = useRef<HTMLFieldSetElement>(null);
  function update(index: number, value: Partial<HeaderLink>) {
    change(
      links.map((link, i) => (i === index ? { ...link, ...value } : link)),
    );
  }
  function focusRow(index: number) {
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLButtonElement>(`[data-link-row="${index}"]`)
        ?.focus(),
    );
  }
  function move(index: number, delta: number) {
    const next = [...links];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    change(next);
    setExpanded(
      expanded === index
        ? index + delta
        : expanded === index + delta
          ? index
          : expanded,
    );
    focusRow(index + delta);
  }
  return (
    <fieldset
      ref={root}
      disabled={disabled}
      className="header-link-editor stack"
    >
      <legend>Navigation links</legend>
      <p className="muted">
        Add up to {maxHeaderLinks} links. Open one to edit its label and
        destination.
      </p>
      {!links.length && <p>No custom links yet.</p>}
      {links.map((link, index) => (
        <div className="header-link-row" key={index}>
          <div className="header-link-summary">
            <button
              type="button"
              className="secondary header-link-expand"
              data-link-row={index}
              aria-expanded={expanded === index}
              aria-controls={`header-link-${index}`}
              onClick={() => setExpanded(expanded === index ? null : index)}
            >
              <strong>{link.label || "New link"}</strong>
              <small>
                {link.destination === "storefront"
                  ? "Storefront home"
                  : link.destination === "website"
                    ? link.url || "Website address needed"
                    : link.destination[0].toUpperCase() +
                      link.destination.slice(1)}
              </small>
            </button>
            <button
              type="button"
              className="secondary"
              aria-label={`Move ${link.label || "new link"} up`}
              disabled={!index}
              onClick={() => move(index, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="secondary"
              aria-label={`Move ${link.label || "new link"} down`}
              disabled={index === links.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </button>
          </div>
          <div
            hidden={expanded !== index}
            id={`header-link-${index}`}
            className="stack header-link-fields"
          >
            <label>
              Link label
              <input
                maxLength={32}
                value={link.label}
                onChange={(e) => update(index, { label: e.target.value })}
              />
            </label>
            <label>
              Destination
              <select
                value={link.destination}
                onChange={(e) =>
                  update(index, {
                    destination: e.target.value as HeaderLink["destination"],
                    url: "",
                  })
                }
              >
                <option value="home">Home</option>
                <option value="shop">Shop</option>
                <option value="about">About</option>
                <option value="contact">Contact</option>
                <option value="website">Website address</option>
              </select>
            </label>
            {link.destination === "website" && (
              <label>
                HTTPS website address
                <input
                  type="text"
                  inputMode="url"
                  maxLength={2048}
                  placeholder="https://yourbusiness.com/about"
                  value={link.url}
                  aria-invalid={!validWebsiteUrl(link.url)}
                  onChange={(e) => update(index, { url: e.target.value })}
                />
              </label>
            )}
            <button
              type="button"
              className="secondary"
              onClick={() => {
                change(links.filter((_, i) => i !== index));
                setExpanded(null);
                focusRow(Math.max(0, index - 1));
              }}
            >
              Remove link
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={links.length >= maxHeaderLinks}
        onClick={() => {
          change([
            ...links,
            { label: "New link", destination: "shop", url: "" },
          ]);
          setExpanded(links.length);
          focusRow(links.length);
        }}
      >
        Add navigation link
      </button>
    </fieldset>
  );
}
