import { getIndiaDateString, getIndiaHourOfDay, hoursBetween, roundToTwoDecimals } from './timeUtilities.js';

const NIGHT_SHIFT_START_HOUR = 20;
const NIGHT_SHIFT_END_HOUR = 6;

export function isCompletedShift(shift) {
  return Boolean(shift.checkInTime && shift.checkOutTime);
}

export function isNightShift(shift) {
  const startHour = getIndiaHourOfDay(shift.checkInTime);
  return startHour >= NIGHT_SHIFT_START_HOUR || startHour < NIGHT_SHIFT_END_HOUR;
}

/** Splits one completed shift into regular and overtime hours using the industry preset. */
export function calculateShiftBreakdown(shift, preset) {
  const workedHours = roundToTwoDecimals(Math.max(0, hoursBetween(shift.checkInTime, shift.checkOutTime)));
  const regularHours = Math.min(workedHours, preset.standardHoursPerShift);
  const overtimeHours = roundToTwoDecimals(Math.max(0, workedHours - preset.standardHoursPerShift));
  return {
    shiftId: shift.shiftId,
    workDate: getIndiaDateString(shift.checkInTime),
    workedHours,
    regularHours,
    overtimeHours,
    isNightShift: isNightShift(shift),
  };
}

/**
 * Builds a transparent payslip: every rupee is traceable to hours, rates and rules.
 * Shifts still in progress are excluded.
 */
export function calculatePayslip({ shifts, preset, hourlyRateInRupees }) {
  if (!Number.isFinite(hourlyRateInRupees) || hourlyRateInRupees < 0) {
    throw new Error('hourlyRateInRupees must be a non-negative number');
  }

  const shiftBreakdowns = shifts
    .filter(isCompletedShift)
    .map((shift) => calculateShiftBreakdown(shift, preset))
    .sort((first, second) => first.workDate.localeCompare(second.workDate));

  const totalRegularHours = roundToTwoDecimals(shiftBreakdowns.reduce((sum, item) => sum + item.regularHours, 0));
  const totalOvertimeHours = roundToTwoDecimals(shiftBreakdowns.reduce((sum, item) => sum + item.overtimeHours, 0));
  const nightShiftCount = shiftBreakdowns.filter((item) => item.isNightShift).length;

  const overtimeRateInRupees = roundToTwoDecimals(hourlyRateInRupees * preset.overtimeMultiplier);
  const regularPayInRupees = roundToTwoDecimals(totalRegularHours * hourlyRateInRupees);
  const overtimePayInRupees = roundToTwoDecimals(totalOvertimeHours * overtimeRateInRupees);
  const nightAllowanceInRupees = roundToTwoDecimals(nightShiftCount * preset.nightShiftAllowanceInRupees);
  const grossPayInRupees = roundToTwoDecimals(regularPayInRupees + overtimePayInRupees + nightAllowanceInRupees);

  return {
    shiftCount: shiftBreakdowns.length,
    hourlyRateInRupees,
    overtimeRateInRupees,
    overtimeMultiplier: preset.overtimeMultiplier,
    standardHoursPerShift: preset.standardHoursPerShift,
    totalRegularHours,
    totalOvertimeHours,
    nightShiftCount,
    regularPayInRupees,
    overtimePayInRupees,
    nightAllowanceInRupees,
    grossPayInRupees,
    shiftBreakdowns,
  };
}
