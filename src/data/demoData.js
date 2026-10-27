/**
 * Demo organisations, people, shifts and reports for the prototype.
 * Shifts are generated relative to a reference time so the demo always looks current.
 */
import { MILLISECONDS_PER_HOUR } from '../domain/timeUtilities.js';

export const DEMO_ORGANIZATIONS = [
  { organizationId: 'org-construction', name: 'Kaveri Builders, Site 14 (Chennai)', industryKey: 'construction' },
  { organizationId: 'org-hospital', name: 'Sunrise General Hospital (Chennai)', industryKey: 'hospital' },
];

export const DEMO_USERS = [
  { userId: 'admin-meena', organizationId: 'org-construction', role: 'admin', displayName: 'Meena Raghavan', jobTitle: 'Site Manager', hourlyRateInRupees: 0, preferredLanguage: 'en', preferences: { showOriginalReportText: false } },
  { userId: 'worker-ravi', organizationId: 'org-construction', role: 'worker', displayName: 'Ravi Kumar', jobTitle: 'Mason', hourlyRateInRupees: 95, preferredLanguage: 'hi' },
  { userId: 'worker-selvi', organizationId: 'org-construction', role: 'worker', displayName: 'Selvi Murugan', jobTitle: 'Helper', hourlyRateInRupees: 70, preferredLanguage: 'ta' },
  { userId: 'worker-arjun', organizationId: 'org-construction', role: 'worker', displayName: 'Arjun Das', jobTitle: 'Steel Fixer', hourlyRateInRupees: 90, preferredLanguage: 'hi' },
  { userId: 'admin-farah', organizationId: 'org-hospital', role: 'admin', displayName: 'Farah Ali', jobTitle: 'Facilities Manager', hourlyRateInRupees: 0, preferredLanguage: 'en', preferences: { showOriginalReportText: false } },
  { userId: 'worker-priya', organizationId: 'org-hospital', role: 'worker', displayName: 'Priya Sharma', jobTitle: 'Staff Nurse', hourlyRateInRupees: 120, preferredLanguage: 'hi' },
  { userId: 'worker-lakshmi', organizationId: 'org-hospital', role: 'worker', displayName: 'Lakshmi Narayanan', jobTitle: 'Sanitation Staff', hourlyRateInRupees: 75, preferredLanguage: 'ta' },
  { userId: 'worker-joseph', organizationId: 'org-hospital', role: 'worker', displayName: 'Joseph Mathew', jobTitle: 'Ward Attendant', hourlyRateInRupees: 80, preferredLanguage: 'en' },
];

// Daily patterns over the last 14 days: [start hour (IST), length in hours]; null = day off.
const SHIFT_PATTERNS = {
  'worker-ravi': [[8, 10], [8, 10], [8, 11], [8, 10], [8, 10], [8, 10], null],
  'worker-selvi': [[8, 8], [8, 8], [8, 8], null, [8, 8], [8, 8], null],
  'worker-arjun': [[8, 9], [8, 9], null, [8, 9], [8, 9], [8, 9], null],
  'worker-priya': [[20, 12], null, [20, 12], [14, 8], [20, 12], null, [20, 12]],
  'worker-lakshmi': [[6, 8], [6, 8], [6, 8], [6, 8], null, [6, 8], null],
  'worker-joseph': [[14, 8], [14, 8], null, [6, 9], [14, 8], [14, 8], null],
};

const DAYS_OF_HISTORY = 14;
const INDIA_OFFSET_HOURS = 5.5;

function startOfIndiaDay(referenceTime, daysAgo) {
  const reference = new Date(referenceTime);
  const indiaTime = new Date(reference.getTime() + INDIA_OFFSET_HOURS * MILLISECONDS_PER_HOUR);
  const indiaMidnightUtcMilliseconds = Date.UTC(
    indiaTime.getUTCFullYear(), indiaTime.getUTCMonth(), indiaTime.getUTCDate(),
  ) - INDIA_OFFSET_HOURS * MILLISECONDS_PER_HOUR;
  return indiaMidnightUtcMilliseconds - daysAgo * 24 * MILLISECONDS_PER_HOUR;
}

export function generateDemoShifts(referenceTime) {
  const referenceMilliseconds = new Date(referenceTime).getTime();
  const shifts = [];
  for (const [workerId, pattern] of Object.entries(SHIFT_PATTERNS)) {
    const organizationId = DEMO_USERS.find((user) => user.userId === workerId).organizationId;
    for (let daysAgo = DAYS_OF_HISTORY; daysAgo >= 1; daysAgo -= 1) {
      const dayPattern = pattern[daysAgo % pattern.length];
      if (!dayPattern) {
        continue;
      }
      const [startHour, lengthInHours] = dayPattern;
      const checkIn = startOfIndiaDay(referenceTime, daysAgo) + startHour * MILLISECONDS_PER_HOUR;
      const checkOut = checkIn + lengthInHours * MILLISECONDS_PER_HOUR;
      if (checkOut > referenceMilliseconds) {
        continue;
      }
      shifts.push({
        shiftId: `demo-${workerId}-${daysAgo}`,
        workerId,
        organizationId,
        checkInTime: new Date(checkIn).toISOString(),
        checkOutTime: new Date(checkOut).toISOString(),
      });
    }
  }
  return shifts;
}

export function generateDemoReports(referenceTime) {
  const daysAgo = (days) => new Date(new Date(referenceTime).getTime() - days * 24 * MILLISECONDS_PER_HOUR);
  const dateOnly = (date) => new Date(date.getTime() + INDIA_OFFSET_HOURS * MILLISECONDS_PER_HOUR).toISOString().slice(0, 10);
  return [
    {
      reportId: 'demo-report-1', trackingCode: 'GL-DEMO0001', organizationId: 'org-construction',
      category: 'Scaffolding or structure', description: 'Guard rails are missing on the level 3 scaffolding near the lift shaft.',
      isAnonymous: true, reporterUserId: null, submittedDate: dateOnly(daysAgo(2)), submittedAt: null, status: 'open',
      triage: { neutralSummary: 'Guard rails are missing on the level 3 scaffolding near the lift shaft, creating a fall risk.', severity: 'high', containsAbusiveLanguage: false },
    },
    {
      reportId: 'demo-report-2', trackingCode: 'GL-DEMO0002', organizationId: 'org-construction',
      category: 'Pay issue', description: 'Overtime from last Saturday is not shown in my hours.',
      isAnonymous: false, reporterUserId: 'worker-arjun', submittedDate: dateOnly(daysAgo(1)), submittedAt: daysAgo(1).toISOString(), status: 'acknowledged',
      triage: { neutralSummary: 'Overtime worked last Saturday is missing from the recorded hours.', severity: 'medium', containsAbusiveLanguage: false },
    },
    {
      reportId: 'demo-report-3', trackingCode: 'GL-DEMO0003', organizationId: 'org-hospital',
      category: 'Needle-stick injury', description: 'The sharps bin in Ward B is overflowing and nobody has replaced it for two days.',
      isAnonymous: true, reporterUserId: null, submittedDate: dateOnly(daysAgo(1)), submittedAt: null, status: 'open',
      triage: { neutralSummary: 'The sharps bin in Ward B is overflowing and has not been replaced for two days, risking needle-stick injuries.', severity: 'high', containsAbusiveLanguage: false },
    },
  ];
}
