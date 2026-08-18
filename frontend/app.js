const BACKEND_URL = window.BACKEND_URL || 'https://3000-iayqsb01l2pkfhqmfh7ow-956dc7ec.us3.manus.computer';

const form = document.querySelector('#set-form');
const setIdInput = document.querySelector('#set-id');
const exerciseInput = document.querySelector('#exercise');
const weightInput = document.querySelector('#weight');
const repsInput = document.querySelector('#reps');
const loggedAtInput = document.querySelector('#logged-at');
const notesInput = document.querySelector('#notes');
const formTitle = document.querySelector('#form-title');
const submitButton = document.querySelector('#submit-button');
const cancelButton = document.querySelector('#cancel-button');
const formMessage = document.querySelector('#form-message');
const apiStatus = document.querySelector('#api-status');
const setCount = document.querySelector('#set-count');
const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const errorCopy = document.querySelector('#error-copy');
const emptyState = document.querySelector('#empty-state');
const tableWrap = document.querySelector('#table-wrap');
const setsBody = document.querySelector('#sets-body');
const retryButton = document.querySelector('#retry-button');

let sets = [];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function setMessage(message = '', isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle('error', isError);
}

function setView(view) {
  loadingState.classList.toggle('hidden', view !== 'loading');
  errorState.classList.toggle('hidden', view !== 'error');
  emptyState.classList.toggle('hidden', view !== 'empty');
  tableWrap.classList.toggle('hidden', view !== 'table');
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderSets() {
  setCount.textContent = `${sets.length} ${sets.length === 1 ? 'set' : 'sets'}`;
  if (!sets.length) return setView('empty');
  setView('table');
  setsBody.innerHTML = sets.map((set) => `
    <tr>
      <td><strong>${escapeHtml(set.exercise)}</strong>${set.notes ? `<div class="note">${escapeHtml(set.notes)}</div>` : ''}</td>
      <td>${Number(set.weight).toLocaleString()} kg</td>
      <td>${set.reps}</td>
      <td class="mono">${formatDate(set.loggedAt)}</td>
      <td class="action-cell">
        <button class="icon-button" type="button" data-action="edit" data-id="${set.id}">Edit</button>
        <button class="icon-button delete" type="button" data-action="delete" data-id="${set.id}">Delete</button>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

async function request(path, options = {}) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error || 'The request could not be completed.');
  return body;
}

async function loadSets() {
  setView('loading');
  try {
    await request('/health');
    apiStatus.classList.add('online');
    apiStatus.classList.remove('offline');
    apiStatus.lastChild.textContent = ' Online';
    sets = await request('/sets');
    renderSets();
  } catch (error) {
    apiStatus.classList.add('offline');
    apiStatus.classList.remove('online');
    apiStatus.lastChild.textContent = ' Offline';
    errorCopy.textContent = error.message;
    setView('error');
  }
}

function enterEditMode(set) {
  setIdInput.value = set.id;
  exerciseInput.value = set.exercise;
  weightInput.value = set.weight;
  repsInput.value = set.reps;
  loggedAtInput.value = set.loggedAt;
  notesInput.value = set.notes || '';
  formTitle.textContent = 'Correct a workout set';
  submitButton.innerHTML = 'Save changes <span aria-hidden="true">↗</span>';
  cancelButton.classList.remove('hidden');
  exerciseInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  form.reset();
  setIdInput.value = '';
  loggedAtInput.value = today();
  formTitle.textContent = 'Log a workout set';
  submitButton.innerHTML = 'Save set <span aria-hidden="true">↗</span>';
  cancelButton.classList.add('hidden');
  setMessage();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = setIdInput.value;
  const payload = {
    exercise: exerciseInput.value,
    weight: weightInput.value,
    reps: repsInput.value,
    loggedAt: loggedAtInput.value,
    notes: notesInput.value
  };
  submitButton.disabled = true;
  setMessage(id ? 'Saving correction…' : 'Saving your set…');
  try {
    if (id) await request(`/sets/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await request('/sets', { method: 'POST', body: JSON.stringify(payload) });
    resetForm();
    setMessage(id ? 'Set updated.' : 'Set logged. Keep going.');
    sets = await request('/sets');
    renderSets();
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

setsBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = Number(button.dataset.id);
  const selected = sets.find((set) => set.id === id);
  if (!selected) return;

  if (button.dataset.action === 'edit') return enterEditMode(selected);
  if (!window.confirm(`Delete the ${selected.exercise} set?`)) return;

  button.disabled = true;
  try {
    await request(`/sets/${id}`, { method: 'DELETE' });
    sets = await request('/sets');
    renderSets();
    if (setIdInput.value === String(id)) resetForm();
  } catch (error) {
    errorCopy.textContent = error.message;
    setView('error');
  }
});

cancelButton.addEventListener('click', resetForm);
retryButton.addEventListener('click', loadSets);
loggedAtInput.value = today();
loadSets();
