// Fixture primitive: zero consumers (system/orphan-primitive must fire).
export function OverlayPanel({ children }: { children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" className="panel">
      {children}
    </div>
  );
}
