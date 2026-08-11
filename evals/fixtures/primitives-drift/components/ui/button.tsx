// Fixture primitive: consumed by app/settings.tsx (NOT an orphan).
export function Button({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button type="button" className="btn" {...props}>
      {children}
    </button>
  );
}
