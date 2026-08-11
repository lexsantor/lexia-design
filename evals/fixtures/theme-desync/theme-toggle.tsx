// Eval fixture: custom [data-theme] toggle + Tailwind dark: variants with the
// dark variant never re-keyed to the toggle (field learning 9).

export function ThemeToggle() {
  function setTheme(next: "light" | "dark") {
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <div className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <button
        type="button"
        aria-pressed={false}
        onClick={() => setTheme("dark")}
        className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700"
      >
        Dark theme
      </button>
    </div>
  );
}
