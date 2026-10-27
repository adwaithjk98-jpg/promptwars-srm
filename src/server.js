import { createApp } from './app.js';
import { createInMemoryRepository } from './data/inMemoryRepository.js';
import { resolveSessionSecret } from './security/sessionTokens.js';
import { createGeminiClient } from './services/geminiClient.js';
import { createReportTriageService } from './services/reportTriage.js';

const port = Number(process.env.PORT) || 8080;
const isProduction = process.env.NODE_ENV === 'production';

const app = createApp({
  repository: createInMemoryRepository(),
  reportTriageService: createReportTriageService({
    geminiClient: createGeminiClient({ apiKey: process.env.GEMINI_API_KEY }),
  }),
  sessionSecret: resolveSessionSecret(),
  useSecureCookies: isProduction,
});

app.listen(port, () => {
  console.log(`Groundline listening on port ${port}`);
});
