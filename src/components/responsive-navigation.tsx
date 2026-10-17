export function ResponsiveNavigation({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="visible-navigation" aria-label={label}>
      {children}
    </div>
  );
}
