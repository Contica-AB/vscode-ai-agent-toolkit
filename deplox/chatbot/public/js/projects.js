import { IC } from './icons.js';
import {
  sessionId, setSessionId, activeModel, activeProjectId, setActiveProjectId,
  chatWrap, typing, welcome
} from './state.js';
import { scrollBottom } from './helpers.js';

/* ── State ───────────────────────────────────────────────────────────────────── */
let projectList = [];
let detailProjectId = null;   // project currently shown in detail panel

export function getActiveProjectId() { return activeProjectId; }

/* ── DOM refs ────────────────────────────────────────────────────────────────── */
const sidebar       = () => document.getElementById('project-sidebar');
const projectListEl = () => document.getElementById('project-list');
const projectBadge  = () => document.getElementById('project-badge');
const createForm    = () => document.getElementById('project-create-form');
const detailPanel   = () => document.getElementById('project-detail-panel');

/* ── API helpers ─────────────────────────────────────────────────────────────── */
async function api(path, opts = {}) {
  const res = await fetch(`/api/projects${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

/* ── Load & render project list ──────────────────────────────────────────────── */
export async function loadProjects() {
  projectList = await api('');
  renderProjectList();
}

function renderProjectList() {
  const el = projectListEl();
  if (!el) return;

  if (!projectList.length) {
    el.innerHTML = `<div class="proj-empty">
      <p>No projects yet.</p>
      <p style="font-size:.78rem;color:var(--muted)">Create a project to scope your deployments.</p>
    </div>`;
    return;
  }

  el.innerHTML = projectList.map(p => {
    const isActive = p.id === activeProjectId;
    const statusDot = p.lastDeployStatus === 'succeeded' ? 'ok'
      : p.lastDeployStatus === 'failed' ? 'err'
      : p.lastDeployStatus === 'partial' ? 'warn'
      : 'neutral';
    const versionLabel = p.deploymentCount > 0 ? `v${p.deploymentCount}` : 'No deploys';
    const lastDate = p.lastDeployedAt
      ? new Date(p.lastDeployedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : '';

    return `<div class="proj-card ${isActive ? 'active' : ''}" data-id="${p.id}">
      <div class="proj-card-top">
        <div class="proj-card-dot ${statusDot}"></div>
        <div class="proj-card-name">${escHtml(p.name)}</div>
      </div>
      <div class="proj-card-meta">
        <span>${versionLabel}</span>
        ${lastDate ? `<span>${lastDate}</span>` : ''}
        ${p.hasPlan ? '<span class="proj-plan-badge">Plan</span>' : ''}
      </div>
      <div class="proj-card-actions">
        <button class="proj-btn-detail" data-id="${p.id}" title="View details">${IC.ring}</button>
        <button class="proj-btn-delete" data-id="${p.id}" title="Delete project">${IC.xCircle}</button>
      </div>
    </div>`;
  }).join('');

  // Attach click handlers
  el.querySelectorAll('.proj-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't switch if clicking action buttons
      if (e.target.closest('.proj-btn-delete') || e.target.closest('.proj-btn-detail')) return;
      switchProject(card.dataset.id);
    });
  });

  el.querySelectorAll('.proj-btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteProjectConfirm(btn.dataset.id);
    });
  });

  el.querySelectorAll('.proj-btn-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showProjectDetail(btn.dataset.id);
    });
  });
}

/* ── Switch active project ───────────────────────────────────────────────────── */
async function switchProject(id) {
  if (id === activeProjectId) return;

  // Save current session to old project
  if (activeProjectId) {
    await saveCurrentSession();
  }

  setActiveProjectId(id);
  updateBadge();
  renderProjectList();

  // Create new session for the project
  const newSid = Math.random().toString(36).slice(2);
  setSessionId(newSid);
  sessionStorage.setItem('il_session', newSid);

  // Clear chat UI
  clearChatUI();

  // Try to restore saved session from project
  const saved = await api(`/${id}/session`);
  if (saved && !saved.empty && saved.messages?.length > 1) {
    // Restore messages in UI
    restoreMessages(saved.messages);
  }
}

/* ── Save current session to project ─────────────────────────────────────────── */
async function saveCurrentSession() {
  if (!activeProjectId) return;
  // Gather minimal session state from the current chat
  try {
    await api(`/${activeProjectId}/session`, {
      method: 'PUT',
      body: { sessionId },
    });
  } catch {}
}

/* ── Clear and unscope from project ──────────────────────────────────────────── */
export async function unscopeProject() {
  if (activeProjectId) {
    await saveCurrentSession();
  }
  setActiveProjectId(null);
  updateBadge();
  renderProjectList();

  // Fresh session
  const newSid = Math.random().toString(36).slice(2);
  setSessionId(newSid);
  sessionStorage.setItem('il_session', newSid);
  clearChatUI();
}

/* ── Create project ──────────────────────────────────────────────────────────── */
export async function createNewProject() {
  const form = createForm();
  if (!form) return;
  form.style.display = form.style.display === 'none' ? 'flex' : 'none';
}

export async function submitCreateProject() {
  const nameInput = document.getElementById('proj-name-input');
  const rgInput   = document.getElementById('proj-rg-input');
  const locInput  = document.getElementById('proj-loc-input');
  const envInput  = document.getElementById('proj-env-input');

  const name = nameInput?.value?.trim();
  if (!name) return;

  try {
    const project = await api('', {
      method: 'POST',
      body: {
        name,
        defaults: {
          resourceGroup: rgInput?.value?.trim() || '',
          location: locInput?.value?.trim() || '',
          environment: envInput?.value?.trim() || '',
        },
      },
    });

    // Clear form
    if (nameInput) nameInput.value = '';
    if (rgInput) rgInput.value = '';
    if (locInput) locInput.value = '';
    if (envInput) envInput.value = '';
    const form = createForm();
    if (form) form.style.display = 'none';

    // Reload and switch to the new project
    await loadProjects();
    await switchProject(project.id);
  } catch (e) {
    const msg = document.getElementById('pd-save-msg');
    if (msg) { msg.textContent = `Create failed: ${e.message || 'Unknown error'}`; msg.className = 'ps-detail-save-msg err'; }
  }
}

/* ── Delete project ──────────────────────────────────────────────────────────── */
async function deleteProjectConfirm(id) {
  const project = projectList.find(p => p.id === id);
  if (!project) return;
  if (!confirm(`Delete project "${project.name}"? This removes all deployment history and saved state.`)) return;

  await api(`/${id}`, { method: 'DELETE' });

  if (activeProjectId === id) {
    setActiveProjectId(null);
    updateBadge();
    clearChatUI();
  }

  await loadProjects();
}

/* ── Show / hide detail panel ────────────────────────────────────────────────── */
function showDetailView() {
  const list = projectListEl();
  const form = createForm();
  const panel = detailPanel();
  if (list) list.style.display = 'none';
  if (form) form.style.display = 'none';
  if (panel) panel.style.display = 'flex';
}

export function hideDetailView() {
  const list = projectListEl();
  const panel = detailPanel();
  if (panel) panel.style.display = 'none';
  if (list) list.style.display = 'flex';
  detailProjectId = null;
}

/* ── Project detail (renders in sidebar panel) ───────────────────────────────── */
async function showProjectDetail(id) {
  const project = await api(`/${id}`);
  if (!project || project.error) return;

  detailProjectId = id;

  // Title
  const titleEl = document.getElementById('ps-detail-title');
  if (titleEl) titleEl.textContent = project.name;

  // Populate default inputs
  const d = project.defaults || {};
  const rgEl  = document.getElementById('pd-rg');
  const locEl = document.getElementById('pd-loc');
  const envEl = document.getElementById('pd-env');
  if (rgEl)  rgEl.value  = d.resourceGroup || '';
  if (locEl) locEl.value = d.location || '';
  if (envEl) envEl.value = d.environment || '';

  // Clear save message
  const saveMsg = document.getElementById('pd-save-msg');
  if (saveMsg) saveMsg.textContent = '';

  // Render deployment history
  const deployListEl = document.getElementById('pd-deploy-list');
  const deploys = project.deployments || [];
  if (deployListEl) {
    if (deploys.length === 0) {
      deployListEl.innerHTML = '<div class="ps-deploy-empty">No deployments yet.</div>';
    } else {
      deployListEl.innerHTML = deploys.slice(0, 20).map(dep => {
        const icon = dep.status === 'succeeded' ? '✅' : dep.status === 'partial' ? '⚠️' : '❌';
        const date = new Date(dep.timestamp).toLocaleDateString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
        const services = (dep.services || []).map(s => s.serviceLabel || s.service).join(', ') || dep.service || '?';
        return `<div class="ps-deploy-row">
          <span class="ps-deploy-icon">${icon}</span>
          <span class="ps-deploy-ver">v${dep.version}</span>
          <span class="ps-deploy-svc">${escHtml(services)}</span>
          <span class="ps-deploy-date">${date}</span>
        </div>`;
      }).join('');
    }
  }

  // Clear Azure results
  const azureResults = document.getElementById('pd-azure-results');
  if (azureResults) azureResults.innerHTML = '';

  showDetailView();
}

/* ── Save defaults from detail panel ─────────────────────────────────────────── */
export async function saveProjectDefaults() {
  if (!detailProjectId) return;
  const rg  = document.getElementById('pd-rg')?.value?.trim() || '';
  const loc = document.getElementById('pd-loc')?.value?.trim() || '';
  const env = document.getElementById('pd-env')?.value?.trim() || '';
  const msg = document.getElementById('pd-save-msg');

  try {
    await api(`/${detailProjectId}`, {
      method: 'PUT',
      body: { defaults: { resourceGroup: rg, location: loc, environment: env } },
    });
    if (msg) {
      msg.textContent = 'Saved!';
      msg.className = 'ps-detail-save-msg ok';
      setTimeout(() => { msg.textContent = ''; msg.className = 'ps-detail-save-msg'; }, 2000);
    }
    // Refresh list data
    await loadProjects();
  } catch {
    if (msg) {
      msg.textContent = 'Save failed.';
      msg.className = 'ps-detail-save-msg err';
    }
  }
}

/* ── Check Azure status from detail panel ────────────────────────────────────── */
export async function checkAzureStatus() {
  if (!detailProjectId) return;
  const btn = document.getElementById('pd-azure-btn');
  const results = document.getElementById('pd-azure-results');
  if (!btn || !results) return;

  btn.disabled = true;
  btn.textContent = 'Checking…';
  results.innerHTML = '<div class="ps-azure-loading">Querying Azure…</div>';

  try {
    const status = await api(`/${detailProjectId}/azure-status`);
    if (status.services?.length) {
      results.innerHTML = status.services.map(svc => {
        const icon = svc.syncStatus === 'in-sync' ? '✅'
          : svc.syncStatus === 'local-ahead' ? '⬆️'
          : svc.syncStatus === 'failed-in-azure' ? '❌'
          : svc.syncStatus === 'deploying' ? '⏳'
          : '❓';
        const ts = svc.azureTimestamp ? new Date(svc.azureTimestamp).toLocaleString() : '';
        return `<div class="ps-azure-row">
          <span>${icon}</span>
          <span class="ps-azure-svc">${escHtml(svc.serviceLabel)}</span>
          <span class="ps-azure-sync">${svc.syncStatus}</span>
          ${ts ? `<span class="ps-azure-ts">${ts}</span>` : ''}
        </div>`;
      }).join('');
    } else {
      results.innerHTML = '<div class="ps-azure-empty">No services to compare.</div>';
    }
  } catch {
    results.innerHTML = '<div class="ps-azure-empty" style="color:var(--error)">Failed to check Azure status.</div>';
  }

  btn.disabled = false;
  btn.textContent = 'Check Azure Status';
}

/* ── Toggle sidebar ──────────────────────────────────────────────────────────── */
export function toggleSidebar() {
  const sb = sidebar();
  if (!sb) return;
  sb.classList.toggle('open');
}

/* ── Update project badge in header ──────────────────────────────────────────── */
function updateBadge() {
  const badge = projectBadge();
  if (!badge) return;
  if (activeProjectId) {
    const proj = projectList.find(p => p.id === activeProjectId);
    badge.textContent = proj?.name || activeProjectId;
    badge.style.display = 'inline-flex';
  } else {
    badge.textContent = '';
    badge.style.display = 'none';
  }
}

/* ── Clear chat UI ───────────────────────────────────────────────────────────── */
function clearChatUI() {
  // Remove all message rows but keep the typing indicator
  const rows = chatWrap.querySelectorAll('.msg-row:not(#typing)');
  rows.forEach(r => r.remove());
  if (welcome) welcome.style.display = 'block';
}

/* ── Restore messages from saved session ─────────────────────────────────────── */
function restoreMessages(messages) {
  if (welcome) welcome.style.display = 'none';
  for (const msg of messages) {
    if (msg.role === 'system') continue;
    const role = msg.role === 'user' ? 'user' : 'bot';
    // Render message bubble directly (avoids circular import with chat.js)
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;
    const avatar = document.createElement('div');
    avatar.className = `avatar ${role}`;
    avatar.innerHTML = role === 'bot' ? IC.bot : IC.user;
    const wrap = document.createElement('div');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = escHtml(msg.content).replace(/\n/g, '<br>');
    const ts = document.createElement('div');
    ts.className = 'timestamp';
    ts.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    wrap.appendChild(bubble);
    wrap.appendChild(ts);
    row.appendChild(avatar);
    row.appendChild(wrap);
    chatWrap.insertBefore(row, typing);
  }
  scrollBottom();
}

/* ── Init: restore project from localStorage ─────────────────────────────────── */
export async function initProjects() {
  await loadProjects();
  const saved = localStorage.getItem('deplox_active_project');
  if (saved && projectList.find(p => p.id === saved)) {
    setActiveProjectId(saved);
    updateBadge();
    renderProjectList();
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
