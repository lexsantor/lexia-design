// Fixture primitive: a table primitive exists, so inline tables elsewhere are drift.
export function DataTable({ children }: { children: React.ReactNode }) {
  return <table className="data-table">{children}</table>;
}
