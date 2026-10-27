import { randomUUID } from 'node:crypto';
import { DEMO_ORGANIZATIONS, DEMO_USERS, generateDemoReports, generateDemoShifts } from './demoData.js';

/**
 * In-memory data store for the prototype. Every read and write goes through this
 * interface, so it can be replaced by a Firestore-backed repository without touching routes.
 */
export function createInMemoryRepository({ referenceTime = new Date() } = {}) {
  const organizations = structuredClone(DEMO_ORGANIZATIONS);
  const users = structuredClone(DEMO_USERS);
  const shifts = generateDemoShifts(referenceTime);
  const reports = generateDemoReports(referenceTime);

  return {
    listPersonas() {
      return users.map(({ userId, displayName, jobTitle, role, organizationId }) => ({
        userId, displayName, jobTitle, role, organizationId,
      }));
    },
    listOrganizations: () => organizations.map((organization) => ({ ...organization })),
    findUserById: (userId) => users.find((user) => user.userId === userId) ?? null,
    findOrganizationById: (organizationId) =>
      organizations.find((organization) => organization.organizationId === organizationId) ?? null,
    listWorkersByOrganization: (organizationId) =>
      users.filter((user) => user.organizationId === organizationId && user.role === 'worker'),

    listShiftsByWorker: (workerId) => shifts.filter((shift) => shift.workerId === workerId),
    findActiveShift: (workerId) =>
      shifts.find((shift) => shift.workerId === workerId && shift.checkOutTime === null) ?? null,
    startShift({ workerId, organizationId, checkInTime }) {
      const shift = { shiftId: randomUUID(), workerId, organizationId, checkInTime, checkOutTime: null };
      shifts.push(shift);
      return { ...shift };
    },
    endShift({ shiftId, checkOutTime }) {
      const shift = shifts.find((candidate) => candidate.shiftId === shiftId);
      shift.checkOutTime = checkOutTime;
      return { ...shift };
    },

    saveReport(report) {
      reports.push(report);
      return { ...report };
    },
    listReportsByOrganization: (organizationId) =>
      reports.filter((report) => report.organizationId === organizationId).map((report) => ({ ...report })),
    listReportsByReporter: (reporterUserId) =>
      reports.filter((report) => report.reporterUserId === reporterUserId).map((report) => ({ ...report })),
    findReportByTrackingCode: (trackingCode) =>
      reports.find((report) => report.trackingCode === trackingCode) ?? null,
    findReportById: (reportId) => reports.find((report) => report.reportId === reportId) ?? null,
    updateReport(reportId, changes) {
      const report = reports.find((candidate) => candidate.reportId === reportId);
      Object.assign(report, changes);
      return { ...report };
    },
  };
}
