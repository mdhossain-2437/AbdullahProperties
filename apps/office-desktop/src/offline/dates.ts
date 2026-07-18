const dhakaDateFormatter = new Intl.DateTimeFormat("en", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getDhakaCalendarDate(value = new Date()): string {
  const parts = new Map(
    dhakaDateFormatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = parts.get("year");
  const month = parts.get("month");
  const day = parts.get("day");
  if (!year || !month || !day) throw new Error("The Dhaka calendar date is unavailable.");
  return `${year}-${month}-${day}`;
}

export function addDhakaCalendarDays(days: number, value = new Date()): string {
  if (!Number.isInteger(days) || Math.abs(days) > 3_650) {
    throw new RangeError("Calendar-day offset must be a whole number within ten years.");
  }
  const localDate = getDhakaCalendarDate(value);
  const cursor = new Date(`${localDate}T12:00:00.000Z`);
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return cursor.toISOString().slice(0, 10);
}
