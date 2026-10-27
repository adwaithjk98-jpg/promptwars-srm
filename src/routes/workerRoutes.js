import { Router } from 'express';
import { getIndustryPreset } from '../config/industryPresets.js';
import { buildReportRecord, validateReportInput } from '../domain/reportRules.js';
import { requireRole } from '../security/authorization.js';
import { buildWorkerSummary } from '../services/workforceInsights.js';

function toWorkerReportView(report) {
  const { reportId, trackingCode, category, description, isAnonymous, submittedDate, status, triage } = report;
  return { reportId, trackingCode, category, description, isAnonymous, submittedDate, status, triage };
}

export function createWorkerRoutes({ repository, reportTriageService, reportRateLimiter, getCurrentTime }) {
  const router = Router();
  router.use(requireRole('worker'));

  router.get('/overview', (request, response) => {
    const worker = repository.findUserById(request.session.userId);
    const organization = repository.findOrganizationById(worker.organizationId);
    const preset = getIndustryPreset(organization.industryKey);
    const shifts = repository.listShiftsByWorker(worker.userId);
    const summary = buildWorkerSummary({ worker, organization, shifts, referenceTime: getCurrentTime() });
    response.json({
      worker: {
        displayName: worker.displayName,
        jobTitle: worker.jobTitle,
        preferredLanguage: worker.preferredLanguage,
      },
      organization: { name: organization.name, industryLabel: preset.industryLabel },
      rules: { maximumWeeklyHours: preset.maximumWeeklyHours },
      reportCategories: preset.reportCategories,
      activeShift: repository.findActiveShift(worker.userId),
      payslip: summary.payslip,
      payPeriodDays: summary.payPeriodDays,
      fatigue: summary.fatigue,
      reports: repository.listReportsByReporter(worker.userId).map(toWorkerReportView),
    });
  });

  router.post('/shifts/check-in', (request, response) => {
    const worker = repository.findUserById(request.session.userId);
    if (repository.findActiveShift(worker.userId)) {
      return response.status(409).json({ error: 'You are already checked in.' });
    }
    const shift = repository.startShift({
      workerId: worker.userId,
      organizationId: worker.organizationId,
      checkInTime: getCurrentTime().toISOString(),
    });
    return response.status(201).json({ shift });
  });

  router.post('/shifts/check-out', (request, response) => {
    const activeShift = repository.findActiveShift(request.session.userId);
    if (!activeShift) {
      return response.status(409).json({ error: 'You are not checked in.' });
    }
    const shift = repository.endShift({ shiftId: activeShift.shiftId, checkOutTime: getCurrentTime().toISOString() });
    return response.json({ shift });
  });

  router.post('/reports', reportRateLimiter, async (request, response) => {
    const worker = repository.findUserById(request.session.userId);
    const organization = repository.findOrganizationById(worker.organizationId);
    const preset = getIndustryPreset(organization.industryKey);
    const validation = validateReportInput(request.body, preset);
    if (!validation.isValid) {
      return response.status(400).json({ error: validation.errors.join(' ') });
    }
    const report = repository.saveReport(buildReportRecord({
      validatedInput: validation.value,
      reporterUserId: worker.userId,
      organizationId: worker.organizationId,
      submittedAt: getCurrentTime(),
    }));
    const triage = await reportTriageService.triageReport(report, preset);
    const savedReport = triage ? repository.updateReport(report.reportId, { triage }) : report;
    return response.status(201).json({ report: toWorkerReportView(savedReport) });
  });

  router.get('/reports/track/:trackingCode', (request, response) => {
    const trackingCode = String(request.params.trackingCode).trim().toUpperCase();
    const report = repository.findReportByTrackingCode(trackingCode);
    if (!report || report.organizationId !== request.session.organizationId) {
      return response.status(404).json({ error: 'No report found with that tracking code.' });
    }
    const { category, submittedDate, status } = report;
    return response.json({ trackingCode, category, submittedDate, status });
  });

  return router;
}
