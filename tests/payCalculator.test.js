import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getIndustryPreset } from '../src/config/industryPresets.js';
import { calculatePayslip, calculateShiftBreakdown } from '../src/domain/payCalculator.js';

const construction = getIndustryPreset('construction');
const hospital = getIndustryPreset('hospital');

// 08:00 IST = 02:30 UTC; 20:00 IST = 14:30 UTC.
const dayShift = (date, hours) => ({
  shiftId: `day-${date}`,
  checkInTime: `${date}T02:30:00.000Z`,
  checkOutTime: new Date(new Date(`${date}T02:30:00.000Z`).getTime() + hours * 3_600_000).toISOString(),
});
const nightShift = (date, hours) => ({
  shiftId: `night-${date}`,
  checkInTime: `${date}T14:30:00.000Z`,
  checkOutTime: new Date(new Date(`${date}T14:30:00.000Z`).getTime() + hours * 3_600_000).toISOString(),
});

describe('calculateShiftBreakdown', () => {
  it('counts hours above the standard shift as overtime', () => {
    const breakdown = calculateShiftBreakdown(dayShift('2026-10-20', 10), construction);
    assert.equal(breakdown.workedHours, 10);
    assert.equal(breakdown.regularHours, 8);
    assert.equal(breakdown.overtimeHours, 2);
    assert.equal(breakdown.isNightShift, false);
  });

  it('recognises a shift starting at 20:00 IST as a night shift', () => {
    assert.equal(calculateShiftBreakdown(nightShift('2026-10-20', 12), hospital).isNightShift, true);
  });
});

describe('calculatePayslip', () => {
  it('pays regular hours at the base rate and overtime at the multiplier', () => {
    const payslip = calculatePayslip({
      shifts: [dayShift('2026-10-20', 10), dayShift('2026-10-21', 8)],
      preset: construction,
      hourlyRateInRupees: 100,
    });
    assert.equal(payslip.totalRegularHours, 16);
    assert.equal(payslip.totalOvertimeHours, 2);
    assert.equal(payslip.regularPayInRupees, 1600);
    assert.equal(payslip.overtimePayInRupees, 400);
    assert.equal(payslip.grossPayInRupees, 2000);
  });

  it('adds the hospital night allowance per night shift', () => {
    const payslip = calculatePayslip({ shifts: [nightShift('2026-10-20', 8)], preset: hospital, hourlyRateInRupees: 100 });
    assert.equal(payslip.nightShiftCount, 1);
    assert.equal(payslip.nightAllowanceInRupees, 150);
    assert.equal(payslip.grossPayInRupees, 950);
  });

  it('ignores a shift that is still in progress', () => {
    const inProgress = { shiftId: 'open', checkInTime: '2026-10-22T02:30:00.000Z', checkOutTime: null };
    const payslip = calculatePayslip({ shifts: [inProgress], preset: construction, hourlyRateInRupees: 100 });
    assert.equal(payslip.shiftCount, 0);
    assert.equal(payslip.grossPayInRupees, 0);
  });

  it('rejects an invalid hourly rate', () => {
    assert.throws(() => calculatePayslip({ shifts: [], preset: construction, hourlyRateInRupees: -5 }));
  });
});
