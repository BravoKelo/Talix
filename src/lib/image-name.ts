// Keep original filenames in new object keys without exposing path separators.
export function imageObjectName(id: string, filename: string) {
  const encoded = btoa(
    String.fromCharCode(...new TextEncoder().encode(filename)),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  return `${id}--name-${encoded}`;
}
export function savedImageName(url: string | null): string | null {
  if (!url) return null;
  try {
    const stored = decodeURIComponent(
      new URL(url).pathname.split("/").pop() || "",
    );
    const original = stored.match(/^[0-9a-f-]{36}--name-([a-z0-9_-]+)$/i);
    return (
      (original
        ? new TextDecoder().decode(
            Uint8Array.from(
              atob(original[1].replaceAll("-", "+").replaceAll("_", "/")),
              (character) => character.charCodeAt(0),
            ),
          )
        : stored) || "Saved image"
    );
  } catch {
    return "Saved image";
  }
}
