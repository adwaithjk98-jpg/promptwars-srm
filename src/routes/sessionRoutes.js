import { Router } from 'express';
import { getIndustryPreset } from '../config/industryPresets.js';
import { SESSION_COOKIE_NAME, SESSION_DURATION_MILLISECONDS, createSessionToken } from '../security/sessionTokens.js';

/** Demo sign-in: pick a persona. Real deployments would use phone OTP (see docs/future-additions.md). */
export function createSessionRoutes({ repository, sessionSecret, useSecureCookies }) {
  const router = Router();

  router.get('/personas', (_request, response) => {
    const organizations = repository.listOrganizations().map((organization) => ({
      ...organization,
      industryLabel: getIndustryPreset(organization.industryKey).industryLabel,
    }));
    response.json({ organizations, personas: repository.listPersonas() });
  });

  router.get('/session', (request, response) => {
    if (!request.session) {
      return response.status(401).json({ error: 'Please sign in.' });
    }
    const user = repository.findUserById(request.session.userId);
    return response.json({ userId: user.userId, displayName: user.displayName, role: user.role });
  });

  router.post('/session', (request, response) => {
    const userId = typeof request.body?.userId === 'string' ? request.body.userId : '';
    const user = repository.findUserById(userId);
    if (!user) {
      return response.status(400).json({ error: 'Unknown account.' });
    }
    const token = createSessionToken(
      { userId: user.userId, role: user.role, organizationId: user.organizationId },
      sessionSecret,
    );
    response.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: useSecureCookies,
      maxAge: SESSION_DURATION_MILLISECONDS,
      path: '/',
    });
    return response.json({ role: user.role, redirectTo: user.role === 'admin' ? '/admin' : '/worker' });
  });

  router.delete('/session', (_request, response) => {
    response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    response.status(204).end();
  });

  return router;
}
