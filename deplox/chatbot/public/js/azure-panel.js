import { IC } from './icons.js';
import { sessionId, setSessionId } from './state.js';

const azurePanel = document.getElementById('azure-panel');
const apStatus   = document.getElementById('ap-status');

export function openAzurePanel() {
  azurePanel.classList.add('open');
  loadAzureAccount();
}

export function closeAzurePanel() {
  azurePanel.classList.remove('open');
}

export async function loadAzureAccount() {
  apStatus.textContent = '';
  document.getElementById('ap-user').textContent   = 'Loading…';
  document.getElementById('ap-tenant').textContent = '—';

  const [acctRes, ctxRes] = await Promise.all([
    fetch('/api/azure/account'),
    fetch('/api/azure/context')
  ]);
  const acct = await acctRes.json();
  const ctx  = await ctxRes.json();

  if (!acct.loggedIn) {
    document.getElementById('ap-user').textContent   = 'Not signed in';
    document.getElementById('ap-tenant').textContent = '—';
    document.getElementById('ap-sub-list').innerHTML = '<span style="color:var(--muted);font-size:.82rem">Sign in to see subscriptions</span>';
    return;
  }

  document.getElementById('ap-user').textContent   = acct.user;
  document.getElementById('ap-tenant').textContent = acct.tenant || '—';

  const list = document.getElementById('ap-sub-list');
  list.innerHTML = '';
  if (!ctx.subscriptions.length) {
    list.innerHTML = '<span style="color:var(--muted);font-size:.82rem">No subscriptions found</span>';
    return;
  }
  ctx.subscriptions.forEach(sub => {
    const item = document.createElement('div');
    item.className = 'ap-sub-item' + (sub.id === acct.subscription?.id ? ' active' : '');
    item.innerHTML = `<span class="sub-check ic">${sub.id === acct.subscription?.id ? IC.check : IC.ring}</span><span>${sub.name}</span>`;
    item.title = sub.id;
    item.onclick = () => switchSubscription(sub.id, sub.name);
    list.appendChild(item);
  });

  updateAzurePill(true, acct.subscription?.name || acct.user);
}

async function switchSubscription(id, name) {
  apStatus.textContent = `Switching to ${name}…`;
  apStatus.style.color = 'var(--warn)';
  try {
    const r = await fetch('/api/azure/subscription', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: id })
    });
    const d = await r.json();
    if (d.ok) {
      apStatus.textContent = `Active: ${name}`;
      apStatus.style.color = 'var(--success)';
      updateAzurePill(true, name);
      document.querySelectorAll('.ap-sub-item').forEach(el => {
        const isActive = el.title === id;
        el.classList.toggle('active', isActive);
        el.querySelector('.sub-check').innerHTML = isActive ? IC.check : IC.ring;
      });
      await fetch(`/api/session/${sessionId}`, { method: 'DELETE' });
      const newId = Math.random().toString(36).slice(2);
      setSessionId(newId);
      sessionStorage.setItem('il_session', newId);
    } else {
      apStatus.textContent = 'Failed to switch subscription.';
      apStatus.style.color = 'var(--error)';
    }
  } catch { apStatus.textContent = 'Error switching subscription.'; apStatus.style.color = 'var(--error)'; }
}

export async function handleLogin() {
  apStatus.textContent = 'Opening browser for sign-in…';
  apStatus.style.color = 'var(--warn)';
  document.getElementById('ap-login-btn').disabled = true;

  const res = await fetch('/api/azure/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf = '';
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += decoder.decode(value, { stream: true });
    for (const line of buf.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      try {
        const ev = JSON.parse(line.slice(6));
        if (ev.message) { apStatus.textContent = ev.message; }
        if (ev.type === 'success') { apStatus.style.color = 'var(--success)'; loadAzureAccount(); }
        if (ev.type === 'error')   { apStatus.style.color = 'var(--error)'; }
      } catch {}
    }
    buf = buf.split('\n').pop();
  }
  document.getElementById('ap-login-btn').disabled = false;
}

export async function handleLogout() {
  if (!confirm('Sign out of Azure CLI?')) return;
  await fetch('/api/azure/logout', { method: 'POST' });
  updateAzurePill(false, 'Not signed in');
  loadAzureAccount();
}

function updateAzurePill(ok, label) {
  document.getElementById('azure-dot').className  = `dot-status ${ok ? 'ok' : 'err'}`;
  document.getElementById('azure-label').textContent = label;
}

// Close panel when clicking outside
document.addEventListener('click', e => {
  if (!azurePanel.contains(e.target) && !document.getElementById('azure-pill').contains(e.target))
    closeAzurePanel();
});
