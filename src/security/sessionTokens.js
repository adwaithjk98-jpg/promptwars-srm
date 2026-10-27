import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'groundline_session';
export const SESSION_DURATION_MILLISECONDS = 8 * 60 * 60 * 1000;

/** Uses SESSION_SECRET when provided; otherwise a random per-process secret (sessions end on restart). */
export function resolveSessionSecret(environment = process.env) {
  const configuredSecret = environment.SESSION_SECRET;
  if (configuredSecret && configuredSecret.length >= 32) {
    return configuredSecret;
  }
  return randomBytes(32).toString('hex');
}

function signPayload(encodedPayload, sessionSecret) {
  return createHmac('sha256', sessionSecret).update(encodedPayload).digest('base64url');
}

export function createSessionToken({ userId, role, organizationId }, sessionSecret, issuedAt = Date.now()) {
  const payload = { userId, role, organizationId, expiresAt: issuedAt + SESSION_DURATION_MILLISECONDS };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${signPayload(encodedPayload, sessionSecret)}`;
}

/** Returns the session payload, or null if the token is missing, tampered with, or expired. */
export function verifySessionToken(token, sessionSecret, currentTime = Date.now()) {
  if (typeof token !== 'string' || !token.includes('.')) {
    return null;
  }
  const [encodedPayload, providedSignature] = token.split('.');
  const expectedSignature = signPayload(encodedPayload, sessionSecret);
  const providedBuffer = Buffer.from(providedSignature ?? '');
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return payload.expiresAt > currentTime ? payload : null;
  } catch {
    return null;
  }
}

export function readCookie(cookieHeader, cookieName) {
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name === cookieName) {
      return valueParts.join('=');
    }
  }
  return null;
}
