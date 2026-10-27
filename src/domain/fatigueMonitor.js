import { isCompletedShift } from './payCalculator.js';
import { MILLISECONDS_PER_HOUR, getIndiaDateString, hoursBetween, roundToTwoDecimals } from './timeUtilities.js';

const FATIGUE_WINDOW_DAYS = 7;
const DAY_IN_MILLISECONDS = 24 * MILLISECONDS_PER_HOUR;

/** Hours worked on each of the last 7 calendar days (India time), oldest first, for a simple bar chart. */
export function summarizeDailyHours({ shifts, referenceTime, dayCount = FATIGUE_WINDOW_DAYS }) {
  const referenceMilliseconds = new Date(referenceTime).getTime();
  const days = Array.from({ length: dayCount }, (_unused, index) => ({
    workDate: getIndiaDateString(referenceMilliseconds - (dayCount - 1 - index) * DAY_IN_MILLISECONDS),
    workedHours: 0,
  }));
  const dayByDate = new Map(days.map((day) => [day.workDate, day]));
  for (const shift of shifts.filter(isCompletedShift)) {
    const day = dayByDate.get(getIndiaDateString(shift.checkInTime));
    if (day) {
      day.workedHours = roundToTwoDecimals(day.workedHours + hoursBetween(shift.checkInTime, shift.checkOutTime));
    }
  }
  return days;
}

/**
 * Flags overwork early: too many hours this week, too little rest between shifts,
 * or a single shift that ran too long. Looks at the last 7 days before referenceTime.
 */
export function detectFatigueAlerts({ shifts, preset, referenceTime }) {
  const windowStart = new Date(referenceTime).getTime() - FATIGUE_WINDOW_DAYS * 24 * MILLISECONDS_PER_HOUR;
  const recentShifts = shifts
    .filter(isCompletedShift)
    .filter((shift) => new Date(shift.checkOutTime).getTime() >= windowStart)
    .sort((first, second) => new Date(first.checkInTime) - new Date(second.checkInTime));

  const alerts = [];

  const weeklyHours = roundToTwoDecimals(
    recentShifts.reduce((sum, shift) => sum + hoursBetween(shift.checkInTime, shift.checkOutTime), 0),
  );
  if (weeklyHours > preset.maximumWeeklyHours) {
    alerts.push({
      alertType: 'weekly-hours',
      severity: 'high',
      message: `Worked ${weeklyHours} hours in the last 7 days (limit ${preset.maximumWeeklyHours}).`,
    });
  }

  for (let index = 1; index < recentShifts.length; index += 1) {
    const restHours = roundToTwoDecimals(
      hoursBetween(recentShifts[index - 1].checkOutTime, recentShifts[index].checkInTime),
    );
    if (restHours < preset.minimumRestHoursBetweenShifts) {
      alerts.push({
        alertType: 'short-rest',
        severity: 'medium',
        message: `Only ${restHours} hours of rest before the shift on ${getIndiaDateString(recentShifts[index].checkInTime)} (minimum ${preset.minimumRestHoursBetweenShifts}).`,
      });
    }
  }

  for (const shift of recentShifts) {
    const shiftHours = roundToTwoDecimals(hoursBetween(shift.checkInTime, shift.checkOutTime));
    if (shiftHours > preset.maximumSingleShiftHours) {
      alerts.push({
        alertType: 'long-shift',
        severity: 'medium',
        message: `A ${shiftHours}-hour shift on ${getIndiaDateString(shift.checkInTime)} (maximum ${preset.maximumSingleShiftHours}).`,
      });
    }
  }

  return { weeklyHours, alerts };
}
