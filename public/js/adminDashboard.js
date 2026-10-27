import { createElement, formatRupees, requestJson, signOut } from './apiClient.js';

const STATUS_LABELS = { open: 'Open', acknowledged: 'Acknowledged', resolved: 'Resolved' };
const NEXT_STATUSES = { open: ['acknowledged', 'resolved'], acknowledged: ['resolved'], resolved: [] };

const elements = {
  organizationName: document.getElementById('organization-name'),
  adminDetails: document.getElementById('admin-details'),
  totals: document.getElementById('totals'),
  rulesSummary: document.getElementById('rules-summary'),
  workforceRows: document.getElementById('workforce-rows'),
  reportList: document.getElementById('report-list'),
  dashboardMessage: document.getElementById('dashboard-message'),
  refreshButton: document.getElementById('refresh-button'),
  signOutButton: document.getElementById('sign-out-button'),
};

function badge(textValue, level) {
  return createElement('span', { text: textValue, className: `badge badge-${level}` });
}

function renderTotals(totals) {
  const tiles = [
    ['Workers', totals.workerCount],
    ['On shift now', totals.onShiftNow],
    ['Hours this week', totals.weeklyHours],
    ['Overtime hours (14 days)', totals.overtimeHoursLastFortnight],
    ['Workers with fatigue alerts', totals.workersWithFatigueAlerts],
    ['High quit risk', totals.highRiskWorkers],
    ['Unresolved reports', totals.unresolvedReports],
  ];
  elements.totals.replaceChildren(...tiles.map(([label, value]) => {
    const tile = createElement('div', { className: 'stat' });
    tile.append(createElement('span', { text: String(value), className: 'stat-value' }), createElement('span', { text: label, className: 'muted' }));
    return tile;
  }));
}

function renderWorkforce(workerRows) {
  elements.workforceRows.replaceChildren(...workerRows.map((worker) => {
    const row = createElement('tr');
    row.append(createElement('th', { text: `${worker.displayName} (${worker.jobTitle})`, attributes: { scope: 'row' } }));

    const shiftCell = createElement('td');
    shiftCell.append(worker.isOnShift ? badge('On shift', 'on') : createElement('span', { text: 'No', className: 'muted' }));
    row.append(shiftCell);

    row.append(createElement('td', { text: String(worker.weeklyHours), className: 'amount' }));
    row.append(createElement('td', { text: String(worker.overtimeHoursLastFortnight), className: 'amount' }));
    row.append(createElement('td', { text: formatRupees(worker.grossPayLastFortnightInRupees), className: 'amount' }));

    const fatigueCell = createElement('td');
    if (worker.fatigueAlerts.length === 0) {
      fatigueCell.append(createElement('span', { text: 'None', className: 'muted' }));
    } else {
      const list = createElement('ul', { className: 'list' });
      list.append(...worker.fatigueAlerts.map((alert) => createElement('li', { text: alert.message })));
      fatigueCell.append(list);
    }
    row.append(fatigueCell);

    const riskCell = createElement('td');
    riskCell.append(badge(`${worker.attritionRisk.level} (${worker.attritionRisk.score})`, worker.attritionRisk.level));
    if (worker.attritionRisk.reasons.length > 0) {
      riskCell.append(createElement('p', { text: worker.attritionRisk.reasons.join('; '), className: 'muted' }));
    }
    row.append(riskCell);
    return row;
  }));
}

function renderReports(reports) {
  if (reports.length === 0) {
    elements.reportList.replaceChildren(createElement('li', { text: 'No reports yet.', className: 'muted' }));
    return;
  }
  elements.reportList.replaceChildren(...reports.map((report) => {
    const item = createElement('li');
    const heading = createElement('p');
    heading.append(createElement('strong', { text: `${report.category} · ${report.submittedDate} · ${report.reporterName} ` }));
    heading.append(badge(STATUS_LABELS[report.status], report.status));
    if (report.triage) {
      heading.append(' ', badge(`Severity: ${report.triage.severity}`, report.triage.severity === 'low' ? 'low' : report.triage.severity === 'medium' ? 'medium' : 'high'));
    }
    item.append(heading);

    if (report.triage) {
      item.append(createElement('p', { text: `AI summary: ${report.triage.neutralSummary}` }));
      if (report.triage.containsAbusiveLanguage) {
        item.append(createElement('p', { text: 'The original wording contained abusive language; the summary above is neutral.', className: 'muted' }));
      }
    }
    item.append(createElement('p', { text: `Original: ${report.description}`, className: 'muted' }));

    for (const nextStatus of NEXT_STATUSES[report.status]) {
      const button = createElement('button', {
        text: `Mark ${STATUS_LABELS[nextStatus].toLowerCase()}`,
        className: 'secondary',
        attributes: { type: 'button', style: 'margin-right:0.5rem' },
      });
      button.addEventListener('click', () => updateStatus(report.reportId, nextStatus));
      item.append(button);
    }
    return item;
  }));
}

async function updateStatus(reportId, status) {
  try {
    await requestJson(`/api/admin/reports/${encodeURIComponent(reportId)}`, { method: 'PATCH', body: { status } });
    await loadDashboard();
    elements.dashboardMessage.replaceChildren(createElement('p', { text: `Report marked ${STATUS_LABELS[status].toLowerCase()}.`, className: 'notice' }));
  } catch (error) {
    elements.dashboardMessage.replaceChildren(createElement('p', { text: error.message, className: 'error' }));
  }
}

async function loadDashboard() {
  const data = await requestJson('/api/admin/overview');
  elements.organizationName.textContent = data.organization.name;
  elements.adminDetails.textContent = `${data.organization.industryLabel} · ${data.admin.displayName}, ${data.admin.jobTitle}`;
  const rules = data.rules;
  elements.rulesSummary.textContent = `Rules for this ${data.organization.industryLabel.toLowerCase()}: overtime after ${rules.standardHoursPerShift} hours per shift at ${rules.overtimeMultiplier}×, weekly limit ${rules.maximumWeeklyHours} hours, minimum rest ${rules.minimumRestHoursBetweenShifts} hours between shifts${rules.nightShiftAllowanceInRupees ? `, night allowance ${formatRupees(rules.nightShiftAllowanceInRupees)}` : ''}.`;
  renderTotals(data.totals);
  renderWorkforce(data.workerRows);
  renderReports(data.reports);
}

elements.refreshButton.addEventListener('click', loadDashboard);
elements.signOutButton.addEventListener('click', signOut);
loadDashboard().catch((error) => {
  elements.dashboardMessage.replaceChildren(createElement('p', { text: error.message, className: 'error' }));
});
