import { createElement, requestJson } from './apiClient.js';

const personaList = document.getElementById('persona-list');
const signInError = document.getElementById('sign-in-error');

async function signInAs(userId) {
  try {
    const result = await requestJson('/api/session', { method: 'POST', body: { userId } });
    window.location.assign(result.redirectTo);
  } catch (error) {
    signInError.textContent = error.message;
    signInError.hidden = false;
  }
}

async function renderPersonas() {
  const { organizations, personas } = await requestJson('/api/personas');
  for (const organization of organizations) {
    const card = createElement('section', { className: 'card', attributes: { 'aria-label': organization.name } });
    card.append(createElement('h2', { text: organization.name }));
    card.append(createElement('p', { text: organization.industryLabel, className: 'muted' }));
    const members = personas
      .filter((persona) => persona.organizationId === organization.organizationId)
      .sort((first, second) => first.role.localeCompare(second.role));
    for (const persona of members) {
      const button = createElement('button', { className: 'persona-button', attributes: { type: 'button' } });
      button.append(createElement('span', { text: `${persona.displayName}, ${persona.jobTitle}` }));
      button.append(createElement('span', {
        text: persona.role === 'admin' ? 'Manager' : 'Worker',
        className: persona.role === 'admin' ? 'badge badge-acknowledged' : 'badge badge-on',
      }));
      button.addEventListener('click', () => signInAs(persona.userId));
      card.append(button);
    }
    personaList.append(card);
  }
}

renderPersonas().catch((error) => {
  signInError.textContent = error.message;
  signInError.hidden = false;
});
