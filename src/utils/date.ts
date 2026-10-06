/** Calendar-day key used to key both the login streak and the daily
 * challenge's puzzle seed — a plain UTC date, so every player sees the
 * same key (and therefore the same daily puzzle) on a given day regardless
 * of local timezone. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
