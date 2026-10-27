import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';
import { createInMemoryRepository } from '../src/data/inMemoryRepository.js';

const stubTriageService = {
  async triageReport() {
    return { neutralSummary: 'A safety issue was reported.', severity: 'medium', containsAbusiveLanguage: false };
  },
};

let server;
let baseUrl;

before(async () => {
  const app = createApp({
    repository: createInMemoryRepository(),
    reportTriageService: stubTriageService,
    sessionSecret: 'integration-test-secret-long-enough-for-signing',
  });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function signIn(userId) {
  const response = await fetch(`${baseUrl}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  assert.equal(response.status, 200);
  return response.headers.get('set-cookie').split(';')[0];
}

function api(path, cookie, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
  });
}

describe('Groundline API', () => {
  it('serves the health check and security headers', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-security-policy'));
    assert.equal(response.headers.get('x-powered-by'), null);
  });

  it('requires sign-in for worker data', async () => {
    assert.equal((await api('/api/worker/overview')).status, 401);
  });

  it('blocks workers from the admin dashboard', async () => {
    const workerCookie = await signIn('worker-ravi');
    assert.equal((await api('/api/admin/overview', workerCookie)).status, 403);
  });

  it('rejects unknown accounts at sign-in', async () => {
    const response = await api('/api/session', null, { method: 'POST', body: JSON.stringify({ userId: 'intruder' }) });
    assert.equal(response.status, 400);
  });

  it('runs a full check-in and check-out', async () => {
    const cookie = await signIn('worker-selvi');
    assert.equal((await api('/api/worker/shifts/check-in', cookie, { method: 'POST' })).status, 201);
    assert.equal((await api('/api/worker/shifts/check-in', cookie, { method: 'POST' })).status, 409);
    const overview = await (await api('/api/worker/overview', cookie)).json();
    assert.ok(overview.activeShift);
    assert.equal((await api('/api/worker/shifts/check-out', cookie, { method: 'POST' })).status, 200);
  });

  it('keeps anonymous reports anonymous on the admin side', async () => {
    const workerCookie = await signIn('worker-ravi');
    const created = await api('/api/worker/reports', workerCookie, {
      method: 'POST',
      body: JSON.stringify({ category: 'Electrical hazard', description: 'Exposed wiring near the cement mixer.', isAnonymous: true }),
    });
    assert.equal(created.status, 201);
    const { report } = await created.json();
    assert.equal(report.triage.severity, 'medium');

    const adminCookie = await signIn('admin-meena');
    const dashboard = await (await api('/api/admin/overview', adminCookie)).json();
    const adminView = dashboard.reports.find((item) => item.description.startsWith('Exposed wiring'));
    assert.equal(adminView.reporterName, 'Anonymous');
    assert.equal(JSON.stringify(adminView).includes('worker-ravi'), false);
  });

  it('rejects invalid reports', async () => {
    const cookie = await signIn('worker-ravi');
    const response = await api('/api/worker/reports', cookie, {
      method: 'POST',
      body: JSON.stringify({ category: 'Not a category', description: 'x', isAnonymous: 'maybe' }),
    });
    assert.equal(response.status, 400);
  });

  it('stops an admin from seeing or changing another organisation\'s reports', async () => {
    const hospitalAdmin = await signIn('admin-farah');
    const dashboard = await (await api('/api/admin/overview', hospitalAdmin)).json();
    assert.ok(dashboard.reports.every((report) => !report.description.includes('scaffolding')));
    const response = await api('/api/admin/reports/demo-report-1', hospitalAdmin, { method: 'PATCH', body: JSON.stringify({ status: 'resolved' }) });
    assert.equal(response.status, 404);
  });

  it('lets an admin move a report forward but not backward', async () => {
    const adminCookie = await signIn('admin-meena');
    const forward = await api('/api/admin/reports/demo-report-1', adminCookie, { method: 'PATCH', body: JSON.stringify({ status: 'acknowledged' }) });
    assert.equal(forward.status, 200);
    const backward = await api('/api/admin/reports/demo-report-1', adminCookie, { method: 'PATCH', body: JSON.stringify({ status: 'open' }) });
    assert.equal(backward.status, 400);
  });

  it('shows overworked workers as high risk on the dashboard', async () => {
    const adminCookie = await signIn('admin-meena');
    const dashboard = await (await api('/api/admin/overview', adminCookie)).json();
    const ravi = dashboard.workerRows.find((row) => row.userId === 'worker-ravi');
    assert.ok(ravi.fatigueAlerts.length > 0);
    assert.notEqual(ravi.attritionRisk.level, 'low');
  });

  it('saves an admin\'s "always show original text" preference and validates it', async () => {
    const adminCookie = await signIn('admin-meena');
    const invalid = await api('/api/admin/preferences', adminCookie, { method: 'PATCH', body: JSON.stringify({ showOriginalReportText: 'yes' }) });
    assert.equal(invalid.status, 400);
    const saved = await api('/api/admin/preferences', adminCookie, { method: 'PATCH', body: JSON.stringify({ showOriginalReportText: true }) });
    assert.equal(saved.status, 200);
    const dashboard = await (await api('/api/admin/overview', adminCookie)).json();
    assert.equal(dashboard.admin.preferences.showOriginalReportText, true);
  });

  it('accepts reports in the "Other" category', async () => {
    const workerCookie = await signIn('worker-selvi');
    const response = await api('/api/worker/reports', workerCookie, {
      method: 'POST',
      body: JSON.stringify({ category: 'Other', description: 'Drinking water tank is empty since morning.', isAnonymous: true }),
    });
    assert.equal(response.status, 201);
  });
});
