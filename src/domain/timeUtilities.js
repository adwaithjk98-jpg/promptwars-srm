const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const INDIA_STANDARD_TIME_OFFSET_MINUTES = 330;

export function hoursBetween(startTime, endTime) {
  return (new Date(endTime).getTime() - new Date(startTime).getTime()) / MILLISECONDS_PER_HOUR;
}

export function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

/** Hour of day (0–23) in India Standard Time, independent of the server's time zone. */
export function getIndiaHourOfDay(time) {
  const date = new Date(time);
  const minutesSinceMidnightUtc = date.getUTCHours() * 60 + date.getUTCMinutes();
  const minutesSinceMidnightIndia = (minutesSinceMidnightUtc + INDIA_STANDARD_TIME_OFFSET_MINUTES) % 1440;
  return Math.floor(minutesSinceMidnightIndia / 60);
}

/** Calendar date (YYYY-MM-DD) in India Standard Time. */
export function getIndiaDateString(time) {
  const shifted = new Date(new Date(time).getTime() + INDIA_STANDARD_TIME_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export { MILLISECONDS_PER_HOUR };
