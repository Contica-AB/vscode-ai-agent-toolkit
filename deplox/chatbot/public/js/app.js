import { sessionId, input, sendBtn, terminal } from './state.js';
import { send, quickSend } from './chat.js';
import { openAzurePanel, closeAzurePanel, handleLogin, handleLogout } from './azure-panel.js';
import { checkStatus, showHistory, onModelChange } from './status.js';
import {
  initProjects, createNewProject, submitCreateProject, unscopeProject,
  hideDetailView, saveProjectDefaults, checkAzureStatus
} from './projects.js';

// Expose to inline HTML handlers (welcome card chips, etc.)
window.send = send;
window.quickSend = quickSend;
window.showHistory = showHistory;
window.onModelChange = onModelChange;

// ── Auto-resize textarea ──────────────────────────────────────────────────────
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
});
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
});

// ── Header buttons ────────────────────────────────────────────────────────────
document.getElementById('azure-pill').addEventListener('click', () => {
  document.getElementById('azure-panel').classList.contains('open') ? closeAzurePanel() : openAzurePanel();
});
document.getElementById('ap-close-btn').addEventListener('click', closeAzurePanel);
document.getElementById('ap-login-btn').addEventListener('click', handleLogin);
document.getElementById('ap-logout-btn').addEventListener('click', handleLogout);
document.getElementById('history-btn').addEventListener('click', showHistory);
document.getElementById('model-select').addEventListener('change', e => onModelChange(e.target.value));

document.getElementById('new-chat-btn').addEventListener('click', async () => {
  await fetch(`/api/session/${sessionId}`, { method: 'DELETE' });
  sessionStorage.removeItem('il_session');
  location.reload();
});

document.getElementById('term-close-btn').addEventListener('click', () => terminal.classList.remove('open'));
document.getElementById('diag-close-btn').addEventListener('click', () => document.getElementById('diagram-panel').classList.remove('open'));
sendBtn.addEventListener('click', () => send());

// ── Project sidebar ───────────────────────────────────────────────────────────

document.getElementById('proj-add-btn').addEventListener('click', createNewProject);
document.getElementById('proj-create-btn').addEventListener('click', submitCreateProject);
document.getElementById('proj-unscope-btn').addEventListener('click', unscopeProject);

// ── Project detail panel ──────────────────────────────────────────────────────
document.getElementById('ps-detail-back').addEventListener('click', hideDetailView);
document.getElementById('pd-save-btn').addEventListener('click', saveProjectDefaults);
document.getElementById('pd-azure-btn').addEventListener('click', checkAzureStatus);

// ── Init ──────────────────────────────────────────────────────────────────────
initProjects();
checkStatus();
