import { IC } from './icons.js';
import {
  sessionId, setSessionId, activeModel, activeProjectId, setActiveProjectId,
  chatWrap, typing, welcome
} from './state.js';
import { scrollBottom } from './helpers.js';

/* ── State ───────────────────────────────────────────────────────────────────── */
let projectList = [];

export function getActiveProjectId() { return activeProjectId; }

/* ── DOM refs ────────────────────────────────────────────────────────────────── */
const sidebar       = () => document.getElementById('project-sidebar');
const projectListEl = () => document.getElementById('project-list');
const projectBadge  = () => document.getElementById('project-badge');
const createForm    = () => document.getElementById('project-create-form');

/* ── API helpers ─────────────────────────────────────────────────────────────── */
async function api(path, opts = {}) {
  const res = await fetch(`/api/projects${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

/** Add a bot message to chat (local helper to avoid circular import with chat.js) */
function addBotMessage(html) {
  if (welcome) welcome.style.display = 'none';
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  const avatar = document.createElement('div');
  avatar.className = 'avatar bot';
  avatar.innerHTML = IC.bot;
  const wrap = document.createElement('div');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = html;
  const ts = document.createElement('div');
  ts.className = 'timestamp';
  ts.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  wrap.appendChild(bubble);
  wrap.appendChild(ts);
  row.appendChild(avatar);
  row.appendChild(wrap);
  chatWrap.insertBefore(row, typing);
  scrollBottom();
  return bubble;
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
    addBotMessage( `Failed to create project: ${e.message || 'Unknown error'}`);
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

/* ── Project detail (deployment history + Azure status) ──────────────────────── */
async function showProjectDetail(id) {
  const project = await api(`/${id}`);
  if (!project || project.error) return;

  if (welcome) welcome.style.display = 'none';

  let html = `<strong>${escHtml(project.name)}</strong> — Project Details\n\n`;

  // Defaults
  const d = project.defaults || {};
  html += `<div style="margin:8px 0;padding:8px 12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border);font-size:.84rem">`;
  html += `<div style="font-weight:600;margin-bottom:6px;color:var(--accent2)">Defaults</div>`;
  if (d.resourceGroup) html += `<div>Resource Group: <strong>${escHtml(d.resourceGroup)}</strong></div>`;
  if (d.location) html += `<div>Location: <strong>${escHtml(d.location)}</strong></div>`;
  if (d.environment) html += `<div>Environment: <strong>${escHtml(d.environment)}</strong></div>`;
  if (d.subscription?.name) html += `<div>Subscription: <strong>${escHtml(d.subscription.name)}</strong></div>`;
  html += `</div>`;

  // Deployment history
  const deploys = project.deployments || [];
  if (deploys.length === 0) {
    html += `\n<div style="color:var(--muted);font-size:.85rem;margin-top:10px">No deployments yet.</div>`;
  } else {
    html += `\n<div style="margin-top:10px;font-weight:600;font-size:.85rem">Deployment History (${deploys.length})</div>`;
    for (const dep of deploys.slice(0, 10)) {
      const icon = dep.status === 'succeeded' ? '✅' : dep.status === 'partial' ? '⚠️' : '❌';
      const date = new Date(dep.timestamp).toLocaleString();
      const services = (dep.services || []).map(s => s.serviceLabel || s.service).join(', ') || dep.service || '?';
      html += `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:.83rem">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>${icon} <strong>v${dep.version}</strong> — ${escHtml(services)}</span>
          <span style="font-size:.72rem;color:var(--muted)">${date}</span>
        </div>
      </div>`;
    }
  }

  // Azure status button
  html += `\n<div style="margin-top:12px"><button class="proj-azure-check-btn" data-id="${id}" style="background:var(--accent);color:#fff;border:none;padding:7px 16px;border-radius:8px;cursor:pointer;font-size:.83rem;font-weight:600">Check Azure Status</button></div>`;

  addBotMessage( html);

  // Attach azure check handler
  setTimeout(() => {
    document.querySelectorAll('.proj-azure-check-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Checking...';
        try {
          const status = await api(`/${btn.dataset.id}/azure-status`);
          let statusHtml = `<strong>Azure Status</strong> — ${escHtml(status.summary)}\n\n`;
          if (status.services?.length) {
            for (const svc of status.services) {
              const syncIcon = svc.syncStatus === 'in-sync' ? '✅'
                : svc.syncStatus === 'local-ahead' ? '⬆️'
                : svc.syncStatus === 'failed-in-azure' ? '❌'
                : svc.syncStatus === 'deploying' ? '⏳'
                : '❓';
              statusHtml += `<div style="padding:4px 0;font-size:.84rem">${syncIcon} <strong>${escHtml(svc.serviceLabel)}</strong> — ${svc.syncStatus}${svc.azureTimestamp ? ` (Azure: ${new Date(svc.azureTimestamp).toLocaleString()})` : ''}</div>`;
            }
          } else {
            statusHtml += `<div style="color:var(--muted);font-size:.84rem">No services to compare.</div>`;
          }
          addBotMessage( statusHtml);
        } catch {
          addBotMessage( 'Failed to check Azure status.');
        }
        btn.disabled = false;
        btn.textContent = 'Check Azure Status';
      });
    });
  }, 100);
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
    addLocalMessage(role, escHtml(msg.content).replace(/\n/g, '<br>'));
  }
  scrollBottom();
}

/** Render a message bubble (user or bot) without importing chat.js */
function addLocalMessage(role, html) {
  const row = document.createElement('div');
  row.className = `msg-row ${role}`;
  const avatar = document.createElement('div');
  avatar.className = `avatar ${role}`;
  avatar.innerHTML = role === 'bot' ? IC.bot : IC.user;
  const wrap = document.createElement('div');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = html;
  const ts = document.createElement('div');
  ts.className = 'timestamp';
  ts.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  wrap.appendChild(bubble);
  wrap.appendChild(ts);
  row.appendChild(avatar);
  row.appendChild(wrap);
  chatWrap.insertBefore(row, typing);
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
