import { Router } from 'express';
import { getIndustryPreset } from '../config/industryPresets.js';
import { REPORT_STATUSES, canChangeReportStatus } from '../domain/reportRules.js';
import { requireRole } from '../security/authorization.js';
import { buildAdminSummary } from '../services/workforceInsights.js';

export function createAdminRoutes({ repository, getCurrentTime }) {
  const router = Router();
  router.use(requireRole('admin'));

  function toAdminReportView(report) {
    const reporter = report.reporterUserId ? repository.findUserById(report.reporterUserId) : null;
    return {
      reportId: report.reportId,
      category: report.category,
      description: report.description,
      submittedDate: report.submittedDate,
      status: report.status,
      triage: report.triage,
      reporterName: reporter ? reporter.displayName : 'Anonymous',
    };
  }

  router.get('/overview', (request, response) => {
    const organization = repository.findOrganizationById(request.session.organizationId);
    const preset = getIndustryPreset(organization.industryKey);
    const workers = repository.listWorkersByOrganization(organization.organizationId);
    const shiftsByWorkerId = new Map(workers.map((worker) => [worker.userId, repository.listShiftsByWorker(worker.userId)]));
    const reports = repository.listReportsByOrganization(organization.organizationId);
    const admin = repository.findUserById(request.session.userId);
    const summary = buildAdminSummary({ organization, workers, shiftsByWorkerId, reports, referenceTime: getCurrentTime() });

    response.json({
      admin: { displayName: admin.displayName, jobTitle: admin.jobTitle },
      organization: { name: organization.name, industryLabel: preset.industryLabel },
      rules: {
        standardHoursPerShift: preset.standardHoursPerShift,
        overtimeMultiplier: preset.overtimeMultiplier,
        maximumWeeklyHours: preset.maximumWeeklyHours,
        minimumRestHoursBetweenShifts: preset.minimumRestHoursBetweenShifts,
        nightShiftAllowanceInRupees: preset.nightShiftAllowanceInRupees,
      },
      ...summary,
      reports: reports
        .sort((first, second) => second.submittedDate.localeCompare(first.submittedDate))
        .map(toAdminReportView),
    });
  });

  router.patch('/reports/:reportId', (request, response) => {
    const report = repository.findReportById(String(request.params.reportId));
    if (!report || report.organizationId !== request.session.organizationId) {
      return response.status(404).json({ error: 'Report not found.' });
    }
    const nextStatus = request.body?.status;
    if (!REPORT_STATUSES.includes(nextStatus) || !canChangeReportStatus(report.status, nextStatus)) {
      return response.status(400).json({ error: `Cannot change status from ${report.status} to ${nextStatus}.` });
    }
    const updatedReport = repository.updateReport(report.reportId, { status: nextStatus });
    return response.json({ report: toAdminReportView(updatedReport) });
  });

  return router;
}
