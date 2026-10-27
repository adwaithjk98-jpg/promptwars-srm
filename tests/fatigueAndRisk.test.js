import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getIndustryPreset } from '../src/config/industryPresets.js';
import { calculateAttritionRisk } from '../src/domain/attritionRisk.js';
import { detectFatigueAlerts, summarizeDailyHours } from '../src/domain/fatigueMonitor.js';

const construction = getIndustryPreset('construction');
const hospital = getIndustryPreset('hospital');
const hour = 3_600_000;

function shift(startIso, lengthInHours) {
  const start = new Date(startIso).getTime();
  return { checkInTime: new Date(start).toISOString(), checkOutTime: new Date(start + lengthInHours * hour).toISOString() };
}

describe('detectFatigueAlerts', () => {
  it('raises no alerts for a normal week', () => {
    const shifts = [1, 2, 3, 4, 5].map((day) => shift(`2026-10-${10 + day}T02:30:00.000Z`, 8));
    const result = detectFatigueAlerts({ shifts, preset: construction, referenceTime: '2026-10-17T00:00:00.000Z' });
    assert.equal(result.weeklyHours, 40);
    assert.deepEqual(result.alerts, []);
  });

  it('flags hours above the weekly limit', () => {
    const shifts = [1, 2, 3, 4, 5, 6].map((day) => shift(`2026-10-${10 + day}T02:30:00.000Z`, 10));
    const result = detectFatigueAlerts({ shifts, preset: construction, referenceTime: '2026-10-17T12:00:00.000Z' });
    assert.ok(result.alerts.some((alert) => alert.alertType === 'weekly-hours'));
  });

  it('flags too little rest between back-to-back shifts', () => {
    const shifts = [shift('2026-10-15T14:30:00.000Z', 12), shift('2026-10-16T08:30:00.000Z', 8)];
    const result = detectFatigueAlerts({ shifts, preset: hospital, referenceTime: '2026-10-17T00:00:00.000Z' });
    const restAlert = result.alerts.find((alert) => alert.alertType === 'short-rest');
    assert.ok(restAlert);
    assert.match(restAlert.message, /6 hours/);
  });

  it('flags a single shift longer than the maximum', () => {
    const result = detectFatigueAlerts({ shifts: [shift('2026-10-15T02:30:00.000Z', 14)], preset: construction, referenceTime: '2026-10-16T00:00:00.000Z' });
    assert.ok(result.alerts.some((alert) => alert.alertType === 'long-shift'));
  });
});

describe('calculateAttritionRisk', () => {
  it('is low with healthy hours', () => {
    const risk = calculateAttritionRisk({ weeklyHours: 40, maximumWeeklyHours: 48, fatigueAlertCount: 0, overtimeHoursLastFortnight: 2, daysWorkedLastFortnight: 10 });
    assert.equal(risk.level, 'low');
    assert.deepEqual(risk.reasons, []);
  });

  it('is high, with reasons, for an overworked worker', () => {
    const risk = calculateAttritionRisk({ weeklyHours: 62, maximumWeeklyHours: 48, fatigueAlertCount: 2, overtimeHoursLastFortnight: 24, daysWorkedLastFortnight: 12 });
    assert.equal(risk.level, 'high');
    assert.equal(risk.score, 100);
    assert.equal(risk.reasons.length, 4);
  });
});

describe('summarizeDailyHours', () => {
  it('returns 7 days, oldest first, with hours on the right India date', () => {
    const days = summarizeDailyHours({
      shifts: [shift('2026-10-26T02:30:00Z', 10), shift('2026-10-24T02:30:00Z', 8), { checkInTime: '2026-10-27T02:30:00Z', checkOutTime: null }],
      referenceTime: '2026-10-27T06:00:00Z',
    });
    assert.equal(days.length, 7);
    assert.equal(days[6].workDate, '2026-10-27');
    assert.equal(days[6].workedHours, 0);
    assert.equal(days[5].workedHours, 10);
    assert.equal(days[3].workedHours, 8);
  });
});
