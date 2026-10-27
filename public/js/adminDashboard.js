import { createElement, formatRupees, requestJson, signOut } from './apiClient.js';
import { createIcon } from './icons.js';
import { initializeTabs } from './tabs.js';

const STATUS_LABELS = { open: 'Open', acknowledged: 'Acknowledged', resolved: 'Resolved' };
const NEXT_STATUSES = { open: ['acknowledged', 'resolved'], acknowledged: ['resolved'], resolved: [] };
const SEVERITY_BADGE_LEVEL = { low: 'low', medium: 'medium', high: 'high', critical: 'critical' };

const elements = {
  organizationName: document.getElementById('organization-name'),
  adminDetails: document.getElementById('admin-details'),
  rulesSummary: document.getElementById('rules-summary'),
  totals: document.getElementById('totals'),
  attentionList: document.getElementById('attention-list'),
  workforceRows: document.getElementById('workforce-rows'),
  reportList: document.getElementById('report-list'),
  reportsTabBadge: document.getElementById('reports-tab-badge'),
  statusFilter: document.getElementById('status-filter'),
  showOriginalDefault: document.getElementById('show-original-default'),
  reportOptions: document.getElementById('report-options'),
  dashboardMessage: document.getElementById('dashboard-message'),
  refreshButton: document.getElementById('refresh-button'),
  signOutButton: document.getElementById('sign-out-button'),
};

let dashboard = null;
// Reports whose original text the admin has flipped away from their saved default.
const reportsWithOriginalToggled = new Set();
const tabs = initializeTabs(document.getElementById('admin-tabs'));

function badge(label, level) {
  return createElement('span', { text: label, className: `badge badge-${level}` });
}

function renderTotals(totals) {
  const tiles = [
    ['Workers', totals.workerCount, false],
    ['On shift now', totals.onShiftNow, false],
    ['Hours this week', totals.weeklyHours, false],
    ['Overtime hours (14 days)', totals.overtimeHoursLastFortnight, false],
    ['Workers with fatigue alerts', totals.workersWithFatigueAlerts, totals.workersWithFatigueAlerts > 0],
    ['High quit risk', totals.highRiskWorkers, totals.highRiskWorkers > 0],
    ['Unresolved reports', totals.unresolvedReports, totals.unresolvedReports > 0],
  ];
  elements.totals.replaceChildren(...tiles.map(([label, value, needsAttention]) => {
    const tile = createElement('div', { className: needsAttention ? 'stat stat-warning' : 'stat' });
    tile.append(createElement('span', { text: String(value), className: 'stat-value' }), createElement('span', { text: label, className: 'stat-label' }));
    return tile;
  }));
}

function renderAttention() {
  const items = [];
  for (const worker of dashboard.workerRows) {
    if (worker.attritionRisk.level === 'high') {
      items.push({ title: `${worker.displayName} is at high risk of leaving`, detail: worker.attritionRisk.reasons.join('; '), level: 'high', tab: 'workforce' });
    } else if (worker.fatigueAlerts.length > 0) {
      items.push({ title: `${worker.displayName} has ${worker.fatigueAlerts.length} fatigue alert${worker.fatigueAlerts.length === 1 ? '' : 's'}`, detail: worker.fatigueAlerts[0].message, level: 'medium', tab: 'workforce' });
    }
  }
  for (const report of dashboard.reports.filter((item) => item.status === 'open')) {
    const severity = report.triage?.severity;
    items.push({
      title: `Open report: ${report.category}`,
      detail: report.triage?.neutralSummary ?? report.description,
      level: severity === 'critical' || severity === 'high' ? 'high' : 'medium',
      tab: 'reports',
    });
  }

  if (items.length === 0) {
    elements.attentionList.replaceChildren(createElement('li', { text: 'Nothing needs attention right now.', className: 'notice' }));
    return;
  }
  items.sort((first, second) => (first.level === 'high' ? 0 : 1) - (second.level === 'high' ? 0 : 1));
  elements.attentionList.replaceChildren(...items.map((item) => {
    const listItem = createElement('li', { className: `alert ${item.level === 'high' ? 'alert-high' : ''}` });
    const body = createElement('div');
    body.append(createElement('p', { text: item.title, className: 'item-title' }), createElement('p', { text: item.detail, className: 'small' }));
    const viewButton = createElement('button', { text: 'View', className: 'button button-secondary button-small push-end', attributes: { type: 'button' } });
    viewButton.addEventListener('click', () => tabs.selectTabByName(item.tab));
    listItem.append(createIcon('alert'), body, viewButton);
    return listItem;
  }));
}

function renderWorkforce() {
  elements.workforceRows.replaceChildren(...dashboard.workerRows.map((worker) => {
    const row = createElement('tr');
    const nameCell = createElement('th', { attributes: { scope: 'row' } });
    nameCell.append(createElement('span', { text: worker.displayName, className: 'item-title' }), createElement('br'), createElement('span', { text: worker.jobTitle, className: 'item-meta' }));
    row.append(nameCell);

    const statusCell = createElement('td');
    statusCell.append(worker.isOnShift ? badge('On shift', 'on') : createElement('span', { text: 'Off shift', className: 'muted' }));
    row.append(statusCell);

    row.append(createElement('td', { text: String(worker.weeklyHours), className: 'numeric' }));
    row.append(createElement('td', { text: String(worker.overtimeHoursLastFortnight), className: 'numeric' }));
    row.append(createElement('td', { text: formatRupees(worker.grossPayLastFortnightInRupees), className: 'numeric' }));

    const fatigueCell = createElement('td');
    if (worker.fatigueAlerts.length === 0) {
      fatigueCell.append(createElement('span', { text: 'None', className: 'muted' }));
    } else {
      for (const alert of worker.fatigueAlerts) {
        fatigueCell.append(createElement('p', { text: alert.message, className: 'small' }));
      }
    }
    row.append(fatigueCell);

    const riskCell = createElement('td');
    const { level, score, reasons } = worker.attritionRisk;
    riskCell.append(badge(`${level[0].toUpperCase()}${level.slice(1)} · ${score}`, level));
    if (reasons.length > 0) {
      riskCell.append(createElement('p', { text: reasons.join('; '), className: 'small muted' }));
    }
    row.append(riskCell);
    return row;
  }));
}

function filteredReports() {
  const filter = elements.statusFilter.value;
  if (filter === 'all') {
    return dashboard.reports;
  }
  if (filter === 'resolved') {
    return dashboard.reports.filter((report) => report.status === 'resolved');
  }
  return dashboard.reports.filter((report) => report.status !== 'resolved');
}

function renderReports() {
  const unresolvedCount = dashboard.reports.filter((report) => report.status !== 'resolved').length;
  elements.reportsTabBadge.textContent = String(unresolvedCount);
  elements.reportsTabBadge.hidden = unresolvedCount === 0;

  const reports = filteredReports();
  if (reports.length === 0) {
    elements.reportList.replaceChildren(createElement('li', { text: 'No reports in this view.', className: 'muted' }));
    return;
  }
  elements.reportList.replaceChildren(...reports.map((report) => {
    const item = createElement('li', { className: 'item' });
    const header = createElement('div', { className: 'item-header' });
    const title = createElement('div');
    title.append(
      createElement('p', { text: report.category, className: 'item-title' }),
      createElement('p', { text: `${report.submittedDate} · ${report.reporterName}`, className: 'item-meta' }),
    );
    const badges = createElement('div');
    if (report.triage) {
      badges.append(badge(`Severity: ${report.triage.severity}`, SEVERITY_BADGE_LEVEL[report.triage.severity]), ' ');
    }
    badges.append(badge(STATUS_LABELS[report.status], report.status));
    header.append(title, badges);
    item.append(header);

    if (report.triage) {
      item.append(createElement('p', { text: report.triage.neutralSummary }));
      if (report.triage.containsAbusiveLanguage) {
        item.append(createElement('p', { text: 'The original wording contained abusive language. The summary above is neutral.', className: 'small muted' }));
      }
      item.append(...createOriginalTextToggle(report));
    } else {
      item.append(createElement('p', { text: report.description }));
    }

    const actions = createElement('div', { className: 'item-actions' });
    for (const nextStatus of NEXT_STATUSES[report.status]) {
      const button = createElement('button', {
        text: `Mark as ${STATUS_LABELS[nextStatus].toLowerCase()}`,
        className: 'button button-secondary button-small',
        attributes: { type: 'button' },
      });
      button.addEventListener('click', () => updateStatus(report.reportId, nextStatus));
      actions.append(button);
    }
    if (actions.childElementCount > 0) {
      item.append(actions);
    }
    return item;
  }));
}

function isOriginalTextVisible(reportId) {
  const showByDefault = dashboard.admin.preferences?.showOriginalReportText === true;
  return reportsWithOriginalToggled.has(reportId) ? !showByDefault : showByDefault;
}

/** A show/hide button for the worker's original words, next to the AI summary. */
function createOriginalTextToggle(report) {
  const originalTextId = `original-${report.reportId}`;
  const isVisible = isOriginalTextVisible(report.reportId);
  const toggleButton = createElement('button', {
    text: isVisible ? 'Hide original message' : 'Show original message',
    className: 'button-link small',
    attributes: { type: 'button', 'aria-expanded': String(isVisible), 'aria-controls': originalTextId },
  });
  const originalText = createElement('p', {
    text: `Original: ${report.description}`,
    className: 'small muted original-text',
    attributes: { id: originalTextId },
  });
  originalText.hidden = !isVisible;
  toggleButton.addEventListener('click', () => {
    if (reportsWithOriginalToggled.has(report.reportId)) {
      reportsWithOriginalToggled.delete(report.reportId);
    } else {
      reportsWithOriginalToggled.add(report.reportId);
    }
    renderReports();
    document.querySelector(`[aria-controls="${originalTextId}"]`)?.focus();
  });
  return [toggleButton, originalText];
}

async function saveShowOriginalPreference() {
  const showOriginalReportText = elements.showOriginalDefault.checked;
  try {
    const { preferences } = await requestJson('/api/admin/preferences', { method: 'PATCH', body: { showOriginalReportText } });
    dashboard.admin.preferences = preferences;
    reportsWithOriginalToggled.clear();
    renderReports();
  } catch (error) {
    elements.showOriginalDefault.checked = !showOriginalReportText;
    elements.dashboardMessage.replaceChildren(createElement('p', { text: error.message, className: 'error' }));
  }
}

async function updateStatus(reportId, status) {
  try {
    await requestJson(`/api/admin/reports/${encodeURIComponent(reportId)}`, { method: 'PATCH', body: { status } });
    await loadDashboard();
    elements.dashboardMessage.replaceChildren(createElement('p', { text: `Report marked as ${STATUS_LABELS[status].toLowerCase()}.`, className: 'notice' }));
  } catch (error) {
    elements.dashboardMessage.replaceChildren(createElement('p', { text: error.message, className: 'error' }));
  }
}

async function loadDashboard() {
  dashboard = await requestJson('/api/admin/overview');
  elements.organizationName.textContent = dashboard.organization.name;
  elements.adminDetails.textContent = `${dashboard.admin.displayName} · ${dashboard.admin.jobTitle}`;
  const rules = dashboard.rules;
  elements.rulesSummary.textContent = `${dashboard.organization.industryLabel} rules: overtime after ${rules.standardHoursPerShift} hours per shift at ${rules.overtimeMultiplier}×, weekly limit ${rules.maximumWeeklyHours} hours, at least ${rules.minimumRestHoursBetweenShifts} hours rest between shifts${rules.nightShiftAllowanceInRupees ? `, night allowance ${formatRupees(rules.nightShiftAllowanceInRupees)} per shift` : ''}.`;
  elements.showOriginalDefault.checked = dashboard.admin.preferences?.showOriginalReportText === true;
  renderTotals(dashboard.totals);
  renderAttention();
  renderWorkforce();
  renderReports();
}

elements.statusFilter.addEventListener('change', renderReports);
elements.showOriginalDefault.addEventListener('change', saveShowOriginalPreference);
// Close the ⋯ menu on an outside click or Escape, returning focus to its button.
document.addEventListener('click', (event) => {
  if (elements.reportOptions.open && !elements.reportOptions.contains(event.target)) {
    elements.reportOptions.open = false;
  }
});
elements.reportOptions.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && elements.reportOptions.open) {
    elements.reportOptions.open = false;
    elements.reportOptions.querySelector('summary').focus();
  }
});
elements.refreshButton.addEventListener('click', () => loadDashboard().catch(() => {}));
elements.signOutButton.addEventListener('click', signOut);
loadDashboard().catch((error) => {
  elements.dashboardMessage.replaceChildren(createElement('p', { text: error.message, className: 'error' }));
});
