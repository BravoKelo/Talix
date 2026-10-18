"use client";
import { useEffect, useRef } from "react";

export function TaskDialog({
  children,
  close,
  title = "Order details",
  closeLabel = "Close",
  busy = false,
  className = "",
  backdropClose = false,
}: {
  children: React.ReactNode;
  close: () => void;
  title?: string;
  closeLabel?: string;
  busy?: boolean;
  className?: string;
  backdropClose?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (previous?.isConnected) previous.focus();
      else
        document
          .querySelector<HTMLElement>("[data-primary-list-action]")
          ?.focus();
    };
  }, []);
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
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
    >
      <div className="dialog-toolbar">
        <strong>{title}</strong>
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
