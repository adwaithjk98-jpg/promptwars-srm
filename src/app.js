import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createSessionMiddleware } from './security/authorization.js';
import { createAdminRoutes } from './routes/adminRoutes.js';
import { createSessionRoutes } from './routes/sessionRoutes.js';
import { createWorkerRoutes } from './routes/workerRoutes.js';

const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** Builds the Express app. Dependencies are passed in so tests can supply their own. */
export function createApp({
  repository,
  reportTriageService,
  sessionSecret,
  useSecureCookies = false,
  getCurrentTime = () => new Date(),
}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: { styleSrc: ["'self'"], scriptSrc: ["'self'"], connectSrc: ["'self'"], formAction: ["'self'"] },
    },
  }));
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use(createSessionMiddleware(sessionSecret));

  const reportRateLimiter = rateLimit({
    windowMs: 10 * 60_000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many reports in a short time. Please wait a few minutes.' },
  });

  app.get('/health', (_request, response) => response.json({ status: 'ok' }));
  app.use('/api', createSessionRoutes({ repository, sessionSecret, useSecureCookies }));
  app.use('/api/worker', createWorkerRoutes({ repository, reportTriageService, reportRateLimiter, getCurrentTime }));
  app.use('/api/admin', createAdminRoutes({ repository, getCurrentTime }));
  app.use('/api', (_request, response) => response.status(404).json({ error: 'Not found.' }));

  // maxAge 0 + ETag: browsers revalidate (cheap 304s), so a redeploy never mixes old CSS with new pages.
  app.use(express.static(publicDirectory, { extensions: ['html'], maxAge: 0 }));

  // Final error handler: log the details server-side, never leak them to the client.
  app.use((error, _request, response, _next) => {
    console.error(error);
    const statusCode = error.status && error.status < 500 ? error.status : 500;
    response.status(statusCode).json({ error: statusCode === 500 ? 'Something went wrong.' : 'Invalid request.' });
  });

  return app;
}
