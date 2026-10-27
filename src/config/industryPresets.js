/**
 * Industry presets calibrate one shared engine for different workplaces.
 * An organisation picks a preset; pay, fatigue and reporting rules follow from it.
 */

const COMMON_REPORT_CATEGORIES = ['Pay issue', 'Working conditions', 'Manager conduct', 'Other'];

export const INDUSTRY_PRESETS = Object.freeze({
  construction: Object.freeze({
    industryKey: 'construction',
    industryLabel: 'Construction site',
    standardHoursPerShift: 8,
    overtimeMultiplier: 2,
    nightShiftAllowanceInRupees: 0,
    maximumWeeklyHours: 48,
    minimumRestHoursBetweenShifts: 10,
    maximumSingleShiftHours: 12,
    reportCategories: Object.freeze([
      'Fall from height',
      'Scaffolding or structure',
      'Electrical hazard',
      'Heat stress',
      'Machinery',
      ...COMMON_REPORT_CATEGORIES,
    ]),
  }),
  hospital: Object.freeze({
    industryKey: 'hospital',
    industryLabel: 'Hospital',
    standardHoursPerShift: 8,
    overtimeMultiplier: 2,
    nightShiftAllowanceInRupees: 150,
    maximumWeeklyHours: 48,
    minimumRestHoursBetweenShifts: 11,
    maximumSingleShiftHours: 12,
    reportCategories: Object.freeze([
      'Needle-stick injury',
      'Chemical exposure',
      'Infection risk',
      'Patient aggression',
      'Slip or fall',
      ...COMMON_REPORT_CATEGORIES,
    ]),
  }),
});

export function getIndustryPreset(industryKey) {
  const preset = INDUSTRY_PRESETS[industryKey];
  if (!preset) {
    throw new Error(`Unknown industry: ${industryKey}`);
  }
  return preset;
}
