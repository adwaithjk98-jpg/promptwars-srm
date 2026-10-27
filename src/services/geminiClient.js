/**
 * Minimal Gemini client using the Interactions API. Tries fast models in order, each with
 * a timeout, and stops when the overall time budget runs out, so callers never hang.
 */
const INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];
const PER_MODEL_TIMEOUT_MILLISECONDS = 8000;
const TOTAL_BUDGET_MILLISECONDS = 15000;

export function extractOutputText(interaction) {
  return (interaction?.steps ?? [])
    .filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === 'text')
    .map((content) => content.text)
    .join('')
    .trim();
}

export function createGeminiClient({ apiKey, models = DEFAULT_MODELS, fetchImplementation = fetch }) {
  return {
    isConfigured: Boolean(apiKey),
    async generateText(input) {
      if (!apiKey) {
        return null;
      }
      const deadline = Date.now() + TOTAL_BUDGET_MILLISECONDS;
      for (const model of models) {
        const remainingMilliseconds = deadline - Date.now();
        if (remainingMilliseconds <= 0) {
          break;
        }
        try {
          const response = await fetchImplementation(INTERACTIONS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({ model, input }),
            signal: AbortSignal.timeout(Math.min(PER_MODEL_TIMEOUT_MILLISECONDS, remainingMilliseconds)),
          });
          if (!response.ok) {
            continue;
          }
          const text = extractOutputText(await response.json());
          if (text) {
            return text;
          }
        } catch {
          // Timeout or network error: fall through to the next model.
        }
      }
      return null;
    },
  };
}
