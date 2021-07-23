export function millisToTime(millis: number): string {
  const seconds = Number((millis / 1000).toFixed(0));
  const minutes = Number((millis / (1000 * 60)).toFixed(0));
  const hours = Number((millis / (1000 * 60 * 60)).toFixed(1));
  const days = Number((millis / (1000 * 60 * 60 * 24)).toFixed(1));
  if (seconds < 60) {
    return seconds + ' seconds';
  } else if (minutes < 60) {
    return minutes + ' minutes';
  } else if (hours < 24) {
    return hours + ' hours';
  }
  return days + ' days';
}
