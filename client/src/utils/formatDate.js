export function formatDate(input) {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
}

// For <input type="date"> — expects "YYYY-MM-DD" in local time.
export function toDateInputValue(input) {
  const d = typeof input === 'string' ? new Date(input) : input;
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}