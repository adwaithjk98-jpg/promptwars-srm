import { randomBytes, randomUUID } from 'node:crypto';
import { getIndiaDateString } from './timeUtilities.js';

export const MINIMUM_DESCRIPTION_LENGTH = 10;
export const MAXIMUM_DESCRIPTION_LENGTH = 1000;
export const REPORT_STATUSES = Object.freeze(['open', 'acknowledged', 'resolved']);

const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  open: ['acknowledged', 'resolved'],
  acknowledged: ['resolved'],
  resolved: [],
});

// Control characters (except tab/newline) are stripped so stored text is safe to display.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Validates untrusted report input. Returns { isValid, errors, value }. */
export function validateReportInput(input, preset) {
  const errors = [];
  const category = typeof input?.category === 'string' ? input.category.trim() : '';
  const description = typeof input?.description === 'string'
    ? input.description.replace(CONTROL_CHARACTERS, '').trim()
    : '';
  const isAnonymous = input?.isAnonymous;

  if (!preset.reportCategories.includes(category)) {
    errors.push('Choose a category from the list.');
  }
  if (description.length < MINIMUM_DESCRIPTION_LENGTH) {
    errors.push(`Describe the issue in at least ${MINIMUM_DESCRIPTION_LENGTH} characters.`);
  }
  if (description.length > MAXIMUM_DESCRIPTION_LENGTH) {
    errors.push(`Keep the description under ${MAXIMUM_DESCRIPTION_LENGTH} characters.`);
  }
  if (typeof isAnonymous !== 'boolean') {
    errors.push('Anonymous must be true or false.');
  }

  return { isValid: errors.length === 0, errors, value: { category, description, isAnonymous } };
}

export function createTrackingCode() {
  return `GL-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Builds a stored report. Anonymous reports keep no reporter identity and only the
 * calendar date, so a report can't be matched to a person by shift timing.
 */
export function buildReportRecord({ validatedInput, reporterUserId, organizationId, submittedAt }) {
  const { category, description, isAnonymous } = validatedInput;
  return {
    reportId: randomUUID(),
    trackingCode: createTrackingCode(),
    organizationId,
    category,
    description,
    isAnonymous,
    reporterUserId: isAnonymous ? null : reporterUserId,
    submittedDate: getIndiaDateString(submittedAt),
    submittedAt: isAnonymous ? null : new Date(submittedAt).toISOString(),
    status: 'open',
    triage: null,
  };
}

export function canChangeReportStatus(currentStatus, nextStatus) {
  return (ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? []).includes(nextStatus);
}
