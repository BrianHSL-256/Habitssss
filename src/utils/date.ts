/** Día calendario del usuario como 'YYYY-MM-DD' según su timezone IANA */
export function localDayKey(date: Date = new Date(), timeZone = 'America/Mexico_City'): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}