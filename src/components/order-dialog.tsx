"use client";
import { useEffect, useRef } from "react";

export function TaskDialog({
  children,
  close,
  title = "Order details",
  closeLabel = "Close",
  busy = false,
}: {
  children: React.ReactNode;
  close: () => void;
  title?: string;
  closeLabel?: string;
  busy?: boolean;
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
      className="order-dialog"
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
