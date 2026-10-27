import { createElement, requestJson } from './apiClient.js';

const organizationList = document.getElementById('organization-list');
const signInError = document.getElementById('sign-in-error');

function showError(message) {
  signInError.textContent = message;
  signInError.hidden = false;
}

async function signInAs(userId) {
  try {
    const result = await requestJson('/api/session', { method: 'POST', body: { userId } });
    window.location.assign(result.redirectTo);
  } catch (error) {
    showError(error.message);
  }
}

function createPersonaButton(persona) {
  const button = createElement('button', { className: 'persona-button', attributes: { type: 'button' } });
  const details = createElement('span');
  details.append(
    createElement('span', { text: persona.displayName, className: 'persona-name' }),
    createElement('span', { text: persona.jobTitle, className: 'persona-role' }),
  );
  const isManager = persona.role === 'admin';
  button.append(details, createElement('span', {
    text: isManager ? 'Manager' : 'Worker',
    className: isManager ? 'badge badge-neutral' : 'badge badge-on',
  }));
  button.addEventListener('click', () => signInAs(persona.userId));
  return button;
}

async function renderOrganizations() {
  const { organizations, personas } = await requestJson('/api/personas');
  for (const organization of organizations) {
    const section = createElement('section', { className: 'organization-card', attributes: { 'aria-label': organization.name } });
    section.append(createElement('p', { text: organization.industryLabel.toUpperCase(), className: 'muted small' }));
    section.append(createElement('h3', { text: organization.name, className: 'card-title' }));
    const list = createElement('ul', { className: 'persona-list' });
    const members = personas
      .filter((persona) => persona.organizationId === organization.organizationId)
      .sort((first, second) => first.role.localeCompare(second.role));
    for (const persona of members) {
      const item = createElement('li');
      item.append(createPersonaButton(persona));
      list.append(item);
    }
    section.append(list);
    organizationList.append(section);
  }
}

renderOrganizations().catch((error) => showError(error.message));
