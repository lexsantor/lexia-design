// Fixture primitive: a form field exists, so native controls elsewhere are drift.
export function Field({ label, id, ...props }: { label: string; id: string } & React.ComponentProps<"input">) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} />
    </div>
  );
}
