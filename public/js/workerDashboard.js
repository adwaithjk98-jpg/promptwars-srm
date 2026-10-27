import { createElement, formatRupees, requestJson, signOut } from './apiClient.js';
import { TRANSLATIONS, translate } from './translations.js';

const LANGUAGE_STORAGE_KEY = 'fairshift-language';
const elements = {
  workerName: document.getElementById('worker-name'),
  workerOrganization: document.getElementById('worker-organization'),
  languageSelect: document.getElementById('language-select'),
  signOutButton: document.getElementById('sign-out-button'),
  shiftButton: document.getElementById('shift-button'),
  shiftStatus: document.getElementById('shift-status'),
  payHeadingText: document.getElementById('pay-heading-text'),
  payTotal: document.getElementById('pay-total'),
  payBreakdown: document.getElementById('pay-breakdown'),
  rateExplanation: document.getElementById('rate-explanation'),
  readAloudButton: document.getElementById('read-aloud-button'),
  weeklyHours: document.getElementById('weekly-hours'),
  fatigueAlerts: document.getElementById('fatigue-alerts'),
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
    createElement('span', { text: activeShift ? '⏹' : '▶', className: 'icon', attributes: { 'aria-hidden': 'true' } }),
    createElement('span', { text: activeShift ? text('checkOut') : text('checkIn') }),
  );
  elements.shiftButton.classList.toggle('is-checked-in', Boolean(activeShift));
  elements.shiftStatus.textContent = activeShift
    ? `${text('checkedInSince')}: ${new Date(activeShift.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : text('notCheckedIn');
}

function renderPay() {
  const payslip = overview.payslip;
  elements.payHeadingText.textContent = text('payHeading', { days: overview.payPeriodDays });
  elements.payTotal.textContent = formatRupees(payslip.grossPayInRupees);

  const rows = [
    [`${text('regularWork')} (${payslip.totalRegularHours} ${text('hours')})`, payslip.regularPayInRupees],
    [`${text('overtime')} (${payslip.totalOvertimeHours} ${text('hours')})`, payslip.overtimePayInRupees],
  ];
  if (payslip.nightShiftCount > 0) {
    rows.push([`${text('nightAllowance')} (×${payslip.nightShiftCount})`, payslip.nightAllowanceInRupees]);
  }
  rows.push([text('totalPay'), payslip.grossPayInRupees]);
  elements.payBreakdown.replaceChildren(...rows.map(([label, amount]) => {
    const row = createElement('tr');
    row.append(createElement('th', { text: label, attributes: { scope: 'row' } }));
    row.append(createElement('td', { text: formatRupees(amount), className: 'amount' }));
    return row;
  }));

  elements.rateExplanation.textContent = text('rateExplanation', {
    rate: payslip.hourlyRateInRupees,
    standard: payslip.standardHoursPerShift,
    multiplier: payslip.overtimeMultiplier,
    overtimeRate: payslip.overtimeRateInRupees,
  });
}

function renderFatigue() {
  elements.weeklyHours.textContent = `${overview.fatigue.weeklyHours} ${text('hours')}`;
  const alerts = overview.fatigue.alerts;
  if (alerts.length === 0) {
    elements.fatigueAlerts.replaceChildren(createElement('p', { text: text('noFatigue'), className: 'notice' }));
    return;
  }
  elements.fatigueAlerts.replaceChildren(...alerts.map((alert) =>
    createElement('p', { text: `⚠ ${alert.message}`, className: alert.severity === 'high' ? 'alert alert-high' : 'alert' })));
}

function renderReportCategories() {
  elements.reportCategory.replaceChildren(...overview.reportCategories.map((category) =>
    createElement('option', { text: category, attributes: { value: category } })));
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
    const item = createElement('li');
    item.append(createElement('strong', { text: `${report.category} · ${report.submittedDate} ` }), statusBadge(report.status));
    item.append(createElement('p', { text: report.description, className: 'muted' }));
    return item;
  }));
}

function renderAll() {
  applyStaticText();
  elements.workerName.textContent = `${overview.worker.displayName}, ${overview.worker.jobTitle}`;
  elements.workerOrganization.textContent = `${overview.organization.name} · ${overview.organization.industryLabel}`;
  renderShift();
  renderPay();
  renderFatigue();
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
    showMessage(elements.reportResult, text('reportSent', { code: report.trackingCode }));
    elements.reportForm.reset();
    elements.reportAnonymous.checked = true;
    await loadOverview();
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
    const line = createElement('p', { className: 'notice' });
    line.append(`${result.trackingCode} · ${result.category} · ${result.submittedDate} `, statusBadge(result.status));
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

(async function start() {
  await loadOverview();
  currentLanguage = readSavedLanguage() ?? overview.worker.preferredLanguage ?? 'en';
  if (!TRANSLATIONS[currentLanguage]) {
    currentLanguage = 'en';
  }
  elements.languageSelect.value = currentLanguage;
  renderAll();
})().catch((error) => showMessage(elements.reportResult, error.message, true));
