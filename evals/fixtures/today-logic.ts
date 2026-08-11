// Eval fixture: server-local "today" logic that drifts for users in other
// timezones (field learning 19). Both patterns must fire the detector.

export function isSameDayNaive(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function startOfTodayNaive(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Correct shape (for contrast; not flagged): route through one tz helper.
export function startOfDayInZone(now: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${parts}T00:00:00`);
}
