import { getIndustryPreset } from '../config/industryPresets.js';
import { calculateAttritionRisk } from '../domain/attritionRisk.js';
import { detectFatigueAlerts } from '../domain/fatigueMonitor.js';
import { calculatePayslip } from '../domain/payCalculator.js';
import { MILLISECONDS_PER_HOUR } from '../domain/timeUtilities.js';

const PAY_PERIOD_DAYS = 14;

function shiftsInLastDays(shifts, days, referenceTime) {
  const windowStart = new Date(referenceTime).getTime() - days * 24 * MILLISECONDS_PER_HOUR;
  return shifts.filter((shift) => new Date(shift.checkInTime).getTime() >= windowStart);
}

/** Everything a worker sees on their dashboard, computed from their own shifts. */
export function buildWorkerSummary({ worker, organization, shifts, referenceTime }) {
  const preset = getIndustryPreset(organization.industryKey);
  const payPeriodShifts = shiftsInLastDays(shifts, PAY_PERIOD_DAYS, referenceTime);
  const payslip = calculatePayslip({ shifts: payPeriodShifts, preset, hourlyRateInRupees: worker.hourlyRateInRupees });
  const fatigue = detectFatigueAlerts({ shifts, preset, referenceTime });
  const attritionRisk = calculateAttritionRisk({
    weeklyHours: fatigue.weeklyHours,
    maximumWeeklyHours: preset.maximumWeeklyHours,
    fatigueAlertCount: fatigue.alerts.length,
    overtimeHoursLastFortnight: payslip.totalOvertimeHours,
    daysWorkedLastFortnight: payslip.shiftCount,
  });
  return { payslip, fatigue, attritionRisk, payPeriodDays: PAY_PERIOD_DAYS };
}

/** Organisation-wide view for admins: who is overworked, at risk, or on shift now. */
export function buildAdminSummary({ organization, workers, shiftsByWorkerId, reports, referenceTime }) {
  const workerRows = workers.map((worker) => {
    const shifts = shiftsByWorkerId.get(worker.userId) ?? [];
    const { payslip, fatigue, attritionRisk } = buildWorkerSummary({ worker, organization, shifts, referenceTime });
    return {
      userId: worker.userId,
      displayName: worker.displayName,
      jobTitle: worker.jobTitle,
      isOnShift: shifts.some((shift) => shift.checkOutTime === null),
      weeklyHours: fatigue.weeklyHours,
      overtimeHoursLastFortnight: payslip.totalOvertimeHours,
      grossPayLastFortnightInRupees: payslip.grossPayInRupees,
      fatigueAlerts: fatigue.alerts,
      attritionRisk,
    };
  });

  const openReports = reports.filter((report) => report.status !== 'resolved');
  return {
    totals: {
      workerCount: workerRows.length,
      onShiftNow: workerRows.filter((row) => row.isOnShift).length,
      weeklyHours: Math.round(workerRows.reduce((sum, row) => sum + row.weeklyHours, 0)),
      overtimeHoursLastFortnight: Math.round(workerRows.reduce((sum, row) => sum + row.overtimeHoursLastFortnight, 0)),
      workersWithFatigueAlerts: workerRows.filter((row) => row.fatigueAlerts.length > 0).length,
      highRiskWorkers: workerRows.filter((row) => row.attritionRisk.level === 'high').length,
      unresolvedReports: openReports.length,
    },
    workerRows,
  };
}
