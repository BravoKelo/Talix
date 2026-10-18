const paths: Record<string, string> = {
  appearance: "M3 5h18v14H3z M3 9h18 M7 5v4 M11 5v4 M7 13h4v3H7z",
  location:
    "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z M9 10a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
  subscription: "M3 5h18v14H3z M3 10h18 M6 15h5",
  users:
    "M9 11a4 4 0 1 0 0-8 4 4 0 1 0 0 8 M2 21v-2a7 7 0 0 1 14 0v2 M17 4a4 4 0 0 1 0 8 M19 15a5 5 0 0 1 3 5",
  security: "M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6",
  customers:
    "M8 11a4 4 0 1 0 0-8 4 4 0 1 0 0 8 M2 21v-3a6 6 0 0 1 12 0v3 M17 9h5 M17 14h5 M17 19h5",
  inventory: "M3 7l9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10",
  materials: "M3 7l9-5 9 5-9 5z M3 12l9 5 9-5 M3 17l9 5 9-5",
  reports: "M3 3v18h19 M7 17v-5 M12 17V8 M17 17V4",
  employees:
    "M8 10a3 3 0 1 0 0-6 3 3 0 1 0 0 6 M2 21v-3a6 6 0 0 1 8-6 M16 12a5 5 0 1 0 0 10 5 5 0 1 0 0-10 M16 14v3l2 1",
  marketing: "M3 10v5h4l12 5V5L7 10z M7 15l2 6 M22 9v7",
  communications: "M3 5h18v14H3z M3 5l9 8 9-8",
  website: "M3 4h18v16H3z M3 9h18 M7 4v5 M11 4v5 M7 13h10 M7 17h5",
  industry: "M3 21V9l6-4v5l6-4v6h6v9z M6 16h2 M11 16h2 M16 16h2",
  support:
    "M4 14v-3a8 8 0 0 1 16 0v3 M4 12H2v6h4v-6z M20 12h2v6h-4v-6z M20 18c0 3-3 4-8 4",
  integrations:
    "M8 8l-3 3a5 5 0 0 0 7 7l3-3 M16 16l3-3a5 5 0 0 0-7-7L9 9 M8 16l8-8",
};
export function SettingsIcon({ name }: { name: string }) {
  return (
    <svg
      className="settings-icon"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || "M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h4"} />
    </svg>
  );
}
