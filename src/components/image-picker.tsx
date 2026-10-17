"use client";
import { useId, useRef } from "react";

export function ImagePicker({
  label,
  filename,
  disabled = false,
  choose,
}: {
  label: string;
  filename: string | null;
  disabled?: boolean;
  choose: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <div className="image-picker">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={input}
        type="file"
        hidden
        disabled={disabled}
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) choose(file);
        }}
      />
      <div className="image-picker-control">
        <button
          type="button"
          className="secondary"
          disabled={disabled}
          onClick={() => input.current?.click()}
          aria-label={`Choose ${label.toLowerCase()}`}
        >
          Choose image
        </button>
        <span
          className="image-picker-name"
          aria-live="polite"
          title={filename ?? undefined}
        >
          {filename ?? "No file chosen"}
        </span>
      </div>
    </div>
  );
}
