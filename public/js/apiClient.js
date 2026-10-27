/** Small wrapper around fetch for the Groundline JSON API. */
export async function requestJson(url, { method = 'GET', body } = {}) {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  if (response.status === 401) {
    window.location.assign('/');
    throw new Error('Please sign in.');
  }
  if (response.status === 204) {
    return null;
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

export async function signOut() {
  await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' });
  window.location.assign('/');
}

export function formatRupees(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

/** Creates an element with text content only (never innerHTML), so user text can't inject markup. */
export function createElement(tagName, { text, className, attributes } = {}) {
  const element = document.createElement(tagName);
  if (text !== undefined) {
    element.textContent = text;
  }
  if (className) {
    element.className = className;
  }
  for (const [name, value] of Object.entries(attributes ?? {})) {
    element.setAttribute(name, value);
  }
  return element;
}
