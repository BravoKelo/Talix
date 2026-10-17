"use client";
import { useEffect, useRef } from "react";

export function OrderDialog({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="order-dialog"
      aria-label="Order details"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="dialog-toolbar">
        <strong>Order details</strong>
        <button type="button" className="secondary" onClick={close}>
          Close
        </button>
      </div>
      {children}
    </dialog>
  );
}
