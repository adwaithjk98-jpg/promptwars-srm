import { createElement, formatRupees, requestJson, signOut } from './apiClient.js';
import { createIcon } from './icons.js';
import { initializeTabs } from './tabs.js';
import { TRANSLATIONS, translate } from './translations.js';

const LANGUAGE_STORAGE_KEY = 'fairshift-language';
const elements = {
  workerName: document.getElementById('worker-name'),
  workerOrganization: document.getElementById('worker-organization'),
  languageSelect: document.getElementById('language-select'),
  signOutButton: document.getElementById('sign-out-button'),
  shiftButton: document.getElementById('shift-button'),
  shiftStatus: document.getElementById('shift-status'),
  weeklyMeter: document.getElementById('weekly-meter'),
  weeklyHours: document.getElementById('weekly-hours'),
  fatigueAlerts: document.getElementById('fatigue-alerts'),
  payPeriod: document.getElementById('pay-period'),
  payTotal: document.getElementById('pay-total'),
  payBreakdown: document.getElementById('pay-breakdown'),
  rateExplanation: document.getElementById('rate-explanation'),
  readAloudButton: document.getElementById('read-aloud-button'),
  reportForm: document.getElementById('report-form'),
  reportCategory: document.getElementById('report-category'),
  reportDescription: document.getElementById('report-description'),
  reportAnonymous: document.getElementById('report-anonymous'),
  reportResult: document.getElementById('report-result'),
  myReports: document.getElementById('my-reports'),
  trackForm: document.getElementById('track-form'),
  trackingCode: document.getElementById('tracking-code'),
  trackResult: document.getElementById('track-result'),
};

let currentLanguage = 'en';
let overview = null;

const text = (key, values) => translate(currentLanguage, key, values);

function readSavedLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveLanguage(languageCode) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch {
    // Storage may be unavailable (private mode); the choice simply isn't remembered.
  }
}

function showMessage(container, message, isError = false) {
  container.replaceChildren(createElement('p', { text: message, className: isError ? 'error' : 'notice' }));
}

function applyStaticText() {
  document.documentElement.lang = currentLanguage;
  for (const element of document.querySelectorAll('[data-text]')) {
    element.textContent = text(element.dataset.text);
  }
}

function renderShift() {
  const activeShift = overview.activeShift;
  elements.shiftButton.replaceChildren(
    createIcon(activeShift ? 'stop' : 'play'),
    createElement('span', { text: activeShift ? text('checkOut') : text('checkIn') }),
  );
  elements.shiftButton.classList.toggle('is-checked-in', Boolean(activeShift));
  elements.shiftStatus.textContent = activeShift
    ? `${text('checkedInSince')}: ${new Date(activeShift.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : text('notCheckedIn');
}

function renderFatigue() {
  const { weeklyHours, alerts } = overview.fatigue;
  const limit = overview.rules.maximumWeeklyHours;
  elements.weeklyMeter.style.width = `${Math.min(100, (weeklyHours / limit) * 100)}%`;
  elements.weeklyMeter.classList.toggle('is-over', weeklyHours > limit);
  elements.weeklyHours.textContent = text('weeklySummary', { hours: weeklyHours, limit });

  if (alerts.length === 0) {
    elements.fatigueAlerts.replaceChildren(createElement('p', { text: text('noFatigue'), className: 'notice' }));
    return;
  }
  elements.fatigueAlerts.replaceChildren(...alerts.map((alert) => {
    const alertElement = createElement('div', { className: alert.severity === 'high' ? 'alert alert-high' : 'alert', attributes: { role: 'note' } });
    alertElement.append(createIcon('alert'), createElement('span', { text: alert.message }));
    return alertElement;
  }));
}

function renderPay() {
  const payslip = overview.payslip;
  elements.payPeriod.textContent = text('payPeriod', { days: overview.payPeriodDays, shifts: payslip.shiftCount });
  elements.payTotal.textContent = formatRupees(payslip.grossPayInRupees);

  const rows = [
    [`${text('regularWork')} · ${payslip.totalRegularHours} ${text('hours')}`, payslip.regularPayInRupees],
    [`${text('overtime')} · ${payslip.totalOvertimeHours} ${text('hours')}`, payslip.overtimePayInRupees],
  ];
  if (payslip.nightShiftCount > 0) {
    rows.push([`${text('nightAllowance')} · ×${payslip.nightShiftCount}`, payslip.nightAllowanceInRupees]);
  }
  const bodyRows = rows.map(([label, amount]) => {
    const row = createElement('tr');
    row.append(createElement('th', { text: label, attributes: { scope: 'row' } }));
    row.append(createElement('td', { text: formatRupees(amount), className: 'numeric' }));
    return row;
  });
  const totalRow = createElement('tr', { className: 'payslip-row-total' });
  totalRow.append(
    createElement('th', { text: text('totalPay'), attributes: { scope: 'row' } }),
    createElement('td', { text: formatRupees(payslip.grossPayInRupees), className: 'numeric' }),
  );
  elements.payBreakdown.replaceChildren(...bodyRows, totalRow);

  elements.rateExplanation.textContent = text('rateExplanation', {
    rate: payslip.hourlyRateInRupees,
    standard: payslip.standardHoursPerShift,
    multiplier: payslip.overtimeMultiplier,
    overtimeRate: payslip.overtimeRateInRupees,
  });
  elements.readAloudButton.replaceChildren(createIcon('speaker'), createElement('span', { text: text('readAloud') }));
}

function renderReportCategories() {
  const selectedCategory = elements.reportCategory.value;
  elements.reportCategory.replaceChildren(...overview.reportCategories.map((category) =>
    createElement('option', { text: category, attributes: { value: category } })));
  if (selectedCategory) {
    elements.reportCategory.value = selectedCategory;
  }
}

function statusBadge(status) {
  return createElement('span', { text: text(`status_${status}`), className: `badge badge-${status}` });
}

function renderReports() {
  if (overview.reports.length === 0) {
    elements.myReports.replaceChildren(createElement('li', { text: text('noReports'), className: 'muted' }));
    return;
  }
  elements.myReports.replaceChildren(...overview.reports.map((report) => {
    const item = createElement('li', { className: 'item' });
    const header = createElement('div', { className: 'item-header' });
    const title = createElement('div');
    title.append(
      createElement('p', { text: report.category, className: 'item-title' }),
      createElement('p', { text: `${report.submittedDate} · ${report.trackingCode}`, className: 'item-meta' }),
    );
    header.append(title, statusBadge(report.status));
    item.append(header, createElement('p', { text: report.description, className: 'muted small' }));
    return item;
  }));
}

function renderAll() {
  applyStaticText();
  elements.workerName.textContent = `${overview.worker.displayName} · ${overview.worker.jobTitle}`;
  elements.workerOrganization.textContent = overview.organization.name;
  renderShift();
  renderFatigue();
  renderPay();
  renderReportCategories();
  renderReports();
}

async function loadOverview() {
  overview = await requestJson('/api/worker/overview');
  renderAll();
}

function readPayAloud() {
  if (!('speechSynthesis' in window)) {
    return;
  }
  const payslip = overview.payslip;
  const utterance = new SpeechSynthesisUtterance(text('paySpeech', {
    days: overview.payPeriodDays,
    total: Math.round(payslip.grossPayInRupees),
    regular: payslip.totalRegularHours,
    overtime: payslip.totalOvertimeHours,
  }));
  utterance.lang = TRANSLATIONS[currentLanguage].speechLanguage;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

elements.shiftButton.addEventListener('click', async () => {
  elements.shiftButton.disabled = true;
  try {
    const endpoint = overview.activeShift ? '/api/worker/shifts/check-out' : '/api/worker/shifts/check-in';
    await requestJson(endpoint, { method: 'POST' });
    await loadOverview();
  } catch (error) {
    elements.shiftStatus.textContent = error.message;
  } finally {
    elements.shiftButton.disabled = false;
  }
});

elements.reportForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = elements.reportForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const { report } = await requestJson('/api/worker/reports', {
      method: 'POST',
      body: {
        category: elements.reportCategory.value,
        description: elements.reportDescription.value,
        isAnonymous: elements.reportAnonymous.checked,
      },
    });
    elements.reportForm.reset();
    elements.reportAnonymous.checked = true;
    await loadOverview();
    showMessage(elements.reportResult, text('reportSent', { code: report.trackingCode }));
  } catch (error) {
    showMessage(elements.reportResult, error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

elements.trackForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const trackingCode = elements.trackingCode.value.trim();
  if (!trackingCode) {
    return;
  }
  try {
    const result = await requestJson(`/api/worker/reports/track/${encodeURIComponent(trackingCode)}`);
    const line = createElement('div', { className: 'item' });
    const header = createElement('div', { className: 'item-header' });
    header.append(createElement('p', { text: `${result.category} · ${result.submittedDate}`, className: 'item-title' }), statusBadge(result.status));
    line.append(header);
    elements.trackResult.replaceChildren(line);
  } catch (error) {
    showMessage(elements.trackResult, error.message, true);
  }
});

elements.languageSelect.addEventListener('change', () => {
  currentLanguage = elements.languageSelect.value;
  saveLanguage(currentLanguage);
  renderAll();
});

elements.readAloudButton.addEventListener('click', readPayAloud);
elements.signOutButton.addEventListener('click', signOut);
initializeTabs(document.getElementById('worker-tabs'));

(async function start() {
  overview = await requestJson('/api/worker/overview');
  currentLanguage = readSavedLanguage() ?? overview.worker.preferredLanguage ?? 'en';
  if (!TRANSLATIONS[currentLanguage]) {
    currentLanguage = 'en';
  }
  elements.languageSelect.value = currentLanguage;
  renderAll();
})().catch((error) => showMessage(elements.reportResult, error.message, true));
