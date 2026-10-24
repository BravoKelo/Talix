"use client";
import { useEffect, useRef, type RefObject } from "react";

export function TaskDialog({
  children,
  close,
  title = "Order details",
  closeLabel = "Close",
  busy = false,
  className = "",
  backdropClose = false,
  focusKey,
  fallbackFocusRef,
}: {
  children: React.ReactNode;
  close: () => void;
  title?: string;
  closeLabel?: string;
  busy?: boolean;
  className?: string;
  backdropClose?: boolean;
  focusKey?: string;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const focusTitle = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const ownerDocument = element?.ownerDocument;
    const previous = ownerDocument?.activeElement as HTMLElement | null;
    const fallback = fallbackFocusRef?.current;
    element?.showModal();
    return () => {
      element?.close();
      const target = [
        previous,
        fallback,
        ownerDocument?.querySelector<HTMLElement>("[data-primary-list-action]"),
      ].find(
        (candidate) =>
          candidate?.isConnected &&
          candidate.getClientRects().length > 0 &&
          !candidate.matches(":disabled") &&
          !candidate.closest("[inert]"),
      );
      target?.focus();
    };
  }, [fallbackFocusRef]);
  useEffect(() => {
    // Changing a view can remove the focused action without remounting the
    // native dialog. Preserve the original opener while naming the new view.
    if (focusKey !== undefined) focusTitle.current?.focus();
  }, [focusKey]);
  return (
    <dialog
      ref={dialog}
      className={`order-dialog ${className}`}
      onClick={(e) => {
        if (backdropClose && !busy && e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close();
        }
      }}
      aria-label={title}
      onKeyDown={(event) => {
        if (focusKey === undefined || event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button, a[href], input, select, textarea, [tabindex]",
          ),
        ).filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.matches(":disabled") &&
            element.getClientRects().length > 0,
        );
        const active = event.currentTarget.ownerDocument.activeElement;
        const first = controls[0],
          last = controls.at(-1);
        if (
          !first ||
          (event.shiftKey &&
            (active === first || !controls.includes(active as HTMLElement))) ||
          (!event.shiftKey && active === last)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }}
      // Repeated native close requests can become non-cancelable; opt out of
      // them while busy rather than relying only on the cancel handler.
      closedby={busy ? "none" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
    >
      <div className="dialog-toolbar">
        <strong ref={focusTitle} tabIndex={-1}>
          {title}
        </strong>
        <button
          type="button"
          className="secondary"
          onClick={close}
          disabled={busy}
        >
          {closeLabel}
        </button>
      </div>
      {children}
    </dialog>
  );
}

export const OrderDialog = TaskDialog;
