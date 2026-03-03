import { activeModel, setActiveModel } from './state.js';
import { addMessage } from './chat.js';
import { modelLabel } from './helpers.js';

export function onModelChange(val) {
  setActiveModel(val);
  localStorage.setItem('deplox_model', val);
}

export async function showHistory() {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = 'none';
  try {
    const r = await fetch('/api/history');
    const history = await r.json();
    if (!history.length) {
      addMessage('bot', 'No deployments recorded yet. Once you deploy a service the history will appear here.');
      return;
    }
    const rows = history.map(h => {
      const date = new Date(h.timestamp).toLocaleString();
      const icon = h.result === 'success' ? '✅' : '❌';
      const link = h.portalLink
        ? `<a href="${h.portalLink}" target="_blank" style="color:var(--accent2);text-decoration:underline">Open in Portal →</a>`
        : '';
      const detail = h.result === 'success'
        ? `${h.resourceGroup} · ${h.location} · ${h.subscriptionName || h.subscriptionId}`
        : `<span style="color:#f87171">${h.error || 'Unknown error'}</span>`;
      return `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
          <span>${icon} <strong>${h.serviceLabel || h.service}</strong></span>
          <span style="font-size:.75rem;color:var(--muted)">${date}</span>
        </div>
        <div style="font-size:.82rem;color:var(--muted);margin-top:3px">${detail}</div>
        ${link ? `<div style="font-size:.8rem;margin-top:4px">${link}</div>` : ''}
      </div>`;
    }).join('');
    addMessage('bot', `<strong>Deployment History</strong> — ${history.length} record${history.length !== 1 ? 's' : ''}<div style="margin-top:10px">${rows}</div>`);
  } catch {
    addMessage('bot', 'Could not load deployment history.');
  }
}

export async function checkStatus() {
  // Ollama
  try {
    const r = await fetch('/api/ollama/status');
    const d = await r.json();
    const dot = document.getElementById('ollama-dot');
    const sel = document.getElementById('model-select');
    if (d.running && d.models.length) {
      dot.className = 'dot-status ok';
      sel.innerHTML = d.models.map(m =>
        `<option value="${m}" style="background:#1e2235;color:#e2e8f0" ${(activeModel || d.activeModel) === m ? 'selected' : ''}>${modelLabel(m)}</option>`
      ).join('');
      if (!activeModel) { setActiveModel(d.activeModel || d.models[0]); localStorage.setItem('deplox_model', activeModel); }
    } else if (d.running) {
      dot.className = 'dot-status err'; sel.innerHTML = '<option style="background:#1e2235;color:#e2e8f0">No models pulled</option>';
    } else {
      dot.className = 'dot-status err'; sel.innerHTML = '<option style="background:#1e2235;color:#e2e8f0">Ollama offline</option>';
    }
  } catch { document.getElementById('ollama-dot').className = 'dot-status err'; }

  // Azure
  try {
    const r = await fetch('/api/azure/context');
    const d = await r.json();
    const dot   = document.getElementById('azure-dot');
    const label = document.getElementById('azure-label');
    if (d.subscriptions.length) {
      const def = d.subscriptions.find(s => s.isDefault) || d.subscriptions[0];
      dot.className = 'dot-status ok'; label.textContent = def.name;
    } else {
      dot.className = 'dot-status err'; label.textContent = 'Not logged in';
    }
  } catch { document.getElementById('azure-dot').className = 'dot-status err'; }
}
