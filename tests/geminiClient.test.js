import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createGeminiClient, extractOutputText } from '../src/services/geminiClient.js';

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const modelOutput = (text) => ({ steps: [{ type: 'thought' }, { type: 'model_output', content: [{ type: 'text', text }] }] });

describe('extractOutputText', () => {
  it('joins text from model_output steps only', () => {
    assert.equal(extractOutputText(modelOutput('Hello')), 'Hello');
    assert.equal(extractOutputText({ steps: [{ type: 'thought' }] }), '');
    assert.equal(extractOutputText(null), '');
  });
});

describe('createGeminiClient', () => {
  it('returns null without calling the API when no key is configured', async () => {
    let calls = 0;
    const client = createGeminiClient({ apiKey: '', fetchImplementation: async () => { calls += 1; } });
    assert.equal(client.isConfigured, false);
    assert.equal(await client.generateText('hi'), null);
    assert.equal(calls, 0);
  });

  it('falls back to the next model when one is overloaded', async () => {
    const requestedModels = [];
    const client = createGeminiClient({
      apiKey: 'test-key',
      models: ['first-model', 'second-model'],
      fetchImplementation: async (_url, options) => {
        const { model } = JSON.parse(options.body);
        requestedModels.push(model);
        return model === 'first-model' ? jsonResponse({ error: 'busy' }, 503) : jsonResponse(modelOutput('Answer'));
      },
    });
    assert.equal(await client.generateText('hi'), 'Answer');
    assert.deepEqual(requestedModels, ['first-model', 'second-model']);
  });

  it('sends the key in a header, never in the URL', async () => {
    const client = createGeminiClient({
      apiKey: 'secret-key',
      models: ['only-model'],
      fetchImplementation: async (url, options) => {
        assert.equal(url.includes('secret-key'), false);
        assert.equal(options.headers['x-goog-api-key'], 'secret-key');
        return jsonResponse(modelOutput('ok'));
      },
    });
    assert.equal(await client.generateText('hi'), 'ok');
  });

  it('returns null when every model fails or throws', async () => {
    const client = createGeminiClient({
      apiKey: 'test-key',
      models: ['a', 'b'],
      fetchImplementation: async (_url, options) => {
        if (JSON.parse(options.body).model === 'a') {
          throw Object.assign(new Error('timed out'), { name: 'TimeoutError' });
        }
        return jsonResponse({}, 500);
      },
    });
    assert.equal(await client.generateText('hi'), null);
  });
});
