import { createElement, formatRupees, requestJson, signOut } from './apiClient.js';
import { createIcon } from './icons.js';
import { initializeTabs } from './tabs.js';
import { TRANSLATIONS, translate } from './translations.js';

const LANGUAGE_STORAGE_KEY = 'groundline-language';
const TRACKING_CODES_STORAGE_PREFIX = 'groundline-tracking-codes-';
const MAXIMUM_SAVED_TRACKING_CODES = 10;
const LIVE_SHIFT_REFRESH_MILLISECONDS = 30_000;
const MILLISECONDS_PER_HOUR = 3_600_000;
const elements = {
  workerName: document.getElementById('worker-name'),
  workerOrganization: document.getElementById('worker-organization'),
  languageSelect: document.getElementById('language-select'),
  signOutButton: document.getElementById('sign-out-button'),
  shiftButton: document.getElementById('shift-button'),
  shiftStatus: document.getElementById('shift-status'),
  shiftLive: document.getElementById('shift-live'),
  shiftElapsed: document.getElementById('shift-elapsed'),
  shiftEarned: document.getElementById('shift-earned'),
  shiftOvertimeNote: document.getElementById('shift-overtime-note'),
  dayBars: document.getElementById('day-bars'),
  dictateButton: document.getElementById('dictate-button'),
  savedCodes: document.getElementById('saved-codes'),
  savedCodeList: document.getElementById('saved-code-list'),
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
let liveShiftTimer = null;
let activeSpeechRecognition = null;

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

// Tracking codes live only in this browser, keyed per worker, so the server never links a code to a person.
function trackingCodesStorageKey() {
  return `${TRACKING_CODES_STORAGE_PREFIX}${overview.worker.userId}`;
}

function readSavedTrackingCodes() {
  try {
    const saved = JSON.parse(localStorage.getItem(trackingCodesStorageKey()) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTrackingCode({ trackingCode, category, submittedDate }) {
  const savedCodes = [{ trackingCode, category, submittedDate }, ...readSavedTrackingCodes()].slice(0, MAXIMUM_SAVED_TRACKING_CODES);
  try {
    localStorage.setItem(trackingCodesStorageKey(), JSON.stringify(savedCodes));
  } catch {
    // Storage unavailable: the worker still sees the code on screen.
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

function formatDuration(totalHours) {
  const totalMinutes = Math.floor(totalHours * 60);
  return text('hoursMinutes', { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 });
}

/** Running time and an estimate of pay for the shift in progress, using the same rule as the payslip. */
function renderLiveShift() {
  const activeShift = overview.activeShift;
  elements.shiftLive.hidden = !activeShift;
  if (!activeShift) {
    return;
  }
  const { hourlyRateInRupees, overtimeRateInRupees, standardHoursPerShift, overtimeMultiplier } = overview.payslip;
  const workedHours = Math.max(0, (Date.now() - new Date(activeShift.checkInTime).getTime()) / MILLISECONDS_PER_HOUR);
  const regularHours = Math.min(workedHours, standardHoursPerShift);
  const overtimeHours = Math.max(0, workedHours - standardHoursPerShift);
  elements.shiftElapsed.textContent = formatDuration(workedHours);
  elements.shiftEarned.textContent = formatRupees(Math.floor(regularHours * hourlyRateInRupees + overtimeHours * overtimeRateInRupees));
  const isInOvertime = overtimeHours > 0;
  elements.shiftOvertimeNote.textContent = isInOvertime
    ? text('inOvertime', { multiplier: overtimeMultiplier })
    : text('overtimeStartsAfter', { hours: standardHoursPerShift });
  elements.shiftOvertimeNote.classList.toggle('is-overtime', isInOvertime);
}

function restartLiveShiftTimer() {
  clearInterval(liveShiftTimer);
  liveShiftTimer = overview.activeShift ? setInterval(renderLiveShift, LIVE_SHIFT_REFRESH_MILLISECONDS) : null;
}

/** One bar per day: height shows hours, colour shows overtime, so it reads without reading. */
function renderDayBars() {
  const { standardHoursPerShift, maximumSingleShiftHours } = overview.rules;
  const weekdayFormatter = new Intl.DateTimeFormat(`${currentLanguage}-IN`, { weekday: 'short', timeZone: 'Asia/Kolkata' });
  elements.dayBars.replaceChildren(...overview.dailyHours.map(({ workDate, workedHours }) => {
    const dayName = weekdayFormatter.format(new Date(`${workDate}T12:00:00+05:30`));
    const roundedHours = Math.round(workedHours * 10) / 10;
    const bar = createElement('li', { className: 'day-bar', attributes: { 'aria-label': text('dayHours', { day: dayName, hours: roundedHours }) } });
    const column = createElement('span', { className: 'day-bar-column', attributes: { 'aria-hidden': 'true' } });
    const fill = createElement('span', { className: workedHours > standardHoursPerShift ? 'day-bar-fill is-overtime' : 'day-bar-fill' });
    fill.style.height = `${Math.min(100, (workedHours / maximumSingleShiftHours) * 100)}%`;
    column.append(fill);
    bar.append(
      createElement('span', { text: workedHours > 0 ? String(roundedHours) : '–', className: 'day-bar-value', attributes: { 'aria-hidden': 'true' } }),
      column,
      createElement('span', { text: dayName, className: 'day-bar-label', attributes: { 'aria-hidden': 'true' } }),
    );
    return bar;
  }));
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

function renderSavedTrackingCodes() {
  const savedCodes = readSavedTrackingCodes();
  elements.savedCodes.hidden = savedCodes.length === 0;
  elements.savedCodeList.replaceChildren(...savedCodes.map((savedCode) => {
    const item = createElement('li');
    const button = createElement('button', {
      text: `${savedCode.trackingCode} · ${savedCode.category} · ${savedCode.submittedDate}`,
      className: 'button button-secondary button-small saved-code-button',
      attributes: { type: 'button' },
    });
    button.addEventListener('click', () => checkTrackingCode(savedCode.trackingCode));
    item.append(button);
    return item;
  }));
}

function renderAll() {
  applyStaticText();
  elements.workerName.textContent = `${overview.worker.displayName} · ${overview.worker.jobTitle}`;
  elements.workerOrganization.textContent = overview.organization.name;
  renderShift();
  renderLiveShift();
  renderDayBars();
  renderFatigue();
  renderPay();
  renderReportCategories();
  renderReports();
  renderSavedTrackingCodes();
  renderDictateButton();
}

async function loadOverview() {
  overview = await requestJson('/api/worker/overview');
  renderAll();
  restartLiveShiftTimer();
}

const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;

function renderDictateButton() {
  elements.dictateButton.hidden = !SpeechRecognition;
  const isListening = Boolean(activeSpeechRecognition);
  elements.dictateButton.setAttribute('aria-pressed', String(isListening));
  elements.dictateButton.classList.toggle('is-listening', isListening);
  elements.dictateButton.replaceChildren(createIcon('microphone'), createElement('span', { text: text(isListening ? 'listening' : 'speak') }));
}

/** Speak-to-type in the chosen language, for workers who find typing hard. Audio is handled by the browser. */
function toggleDictation() {
  if (activeSpeechRecognition) {
    activeSpeechRecognition.stop();
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = TRANSLATIONS[currentLanguage].speechLanguage;
  recognition.interimResults = false;
  recognition.addEventListener('result', (event) => {
    const spokenText = Array.from(event.results).map((result) => result[0].transcript).join(' ').trim();
    const existingText = elements.reportDescription.value.trim();
    elements.reportDescription.value = existingText ? `${existingText} ${spokenText}` : spokenText;
  });
  recognition.addEventListener('end', () => {
    activeSpeechRecognition = null;
    renderDictateButton();
    elements.reportDescription.focus();
  });
  recognition.addEventListener('error', (event) => {
    showMessage(elements.reportResult, event.error, true);
  });
  activeSpeechRecognition = recognition;
  renderDictateButton();
  recognition.start();
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
    if (report.isAnonymous) {
      saveTrackingCode(report);
    }
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

async function checkTrackingCode(trackingCode) {
  elements.trackingCode.value = trackingCode;
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
}

elements.trackForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const trackingCode = elements.trackingCode.value.trim();
  if (trackingCode) {
    checkTrackingCode(trackingCode);
  }
});

elements.languageSelect.addEventListener('change', () => {
  currentLanguage = elements.languageSelect.value;
  saveLanguage(currentLanguage);
  renderAll();
});

elements.readAloudButton.addEventListener('click', readPayAloud);
elements.dictateButton.addEventListener('click', toggleDictation);
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
  restartLiveShiftTimer();
})().catch((error) => showMessage(elements.reportResult, error.message, true));
