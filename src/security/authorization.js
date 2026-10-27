import { SESSION_COOKIE_NAME, readCookie, verifySessionToken } from './sessionTokens.js';

/** Attaches request.session when a valid session cookie is present. */
export function createSessionMiddleware(sessionSecret) {
  return function attachSession(request, _response, next) {
    const token = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    request.session = verifySessionToken(token, sessionSecret);
    next();
  };
}

/** Rejects requests without a session (401) or with the wrong role (403). Enforced on the server. */
export function requireRole(requiredRole) {
  return function checkRole(request, response, next) {
    if (!request.session) {
      return response.status(401).json({ error: 'Please sign in.' });
    }
    if (request.session.role !== requiredRole) {
      return response.status(403).json({ error: 'You do not have access to this page.' });
    }
    return next();
  };
}
