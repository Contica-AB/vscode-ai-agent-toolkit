import { IC } from './icons.js';
import { terminal, termLog, activeProjectId } from './state.js';
import { scrollBottom } from './helpers.js';
import { showDiagramPanel } from './diagram.js';

export function appendTermLog(msg, cls = '') {
  const lines = msg.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const el = document.createElement('div');
    el.className = `tlog ${cls}`;
    el.textContent = line;
    termLog.appendChild(el);
  }
  termLog.scrollTop = termLog.scrollHeight;
}

/** Build deploy status card (auto-deploys — user already confirmed in chat) */
export function buildDeployCard(config, addMessageFn) {
  const card = document.createElement('div');
  card.className = 'deploy-card';

  const flat = {
    Service:          config.service,
    Subscription:     config.subscriptionName || config.subscriptionId,
    'Resource Group': config.resourceGroup + (config.createResourceGroup ? ' (new)' : ''),
    Location:         config.location,
    ...config.params,
    Tags: JSON.stringify(config.tags)
  };
  let rows = '';
  for (const [k, v] of Object.entries(flat)) {
    const val = Array.isArray(v) ? (v.length ? v.join(', ') : '(none)') : String(v);
    rows += `<div class="param-row"><span class="param-key">${k}</span><span class="param-val">${val}</span></div>`;
  }

  card.innerHTML = `
    <div class="deploy-card-header"><span class="ic" style="margin-right:6px">${IC.rocket}</span>Deploying — ${config.serviceLabel || config.service}</div>
    <div class="deploy-params">${rows}</div>
    <div class="deploy-actions"><span class="deploy-status" style="color:var(--warn);font-size:.83rem;display:inline-flex;align-items:center;gap:5px"><span class="ic">${IC.loader}</span>Starting deployment…</span></div>`;

  setTimeout(() => startDeploy(config, card, addMessageFn), 100);
  return card;
}

/** Execute deployment */
async function startDeploy(config, card, addMessageFn) {
  const statusEl = card.querySelector('.deploy-status');
  const setStatus = (html) => { if (statusEl) statusEl.innerHTML = html; };

  terminal.classList.add('open');
  termLog.innerHTML = '';
  scrollBottom();

  const res = await fetch('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, projectId: activeProjectId })
  });

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = '';
  let   lastError = '';
  let   succeeded = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const ev = JSON.parse(line.slice(6));
        const cls = ev.type === 'success' ? 'success' : ev.type === 'error' ? 'error' : ev.type === 'warn' ? 'warn' : '';
        if (ev.message) appendTermLog(ev.message, cls);
        if (ev.type === 'success') {
          succeeded = true;
          setStatus(`<span style="color:var(--success);font-weight:700;display:inline-flex;align-items:center;gap:5px"><span class="ic">${IC.checkCircle}</span>Deployed successfully!</span>`);
        } else if (ev.type === 'error') {
          lastError = ev.message;
          setStatus(`<span style="color:var(--error);display:inline-flex;align-items:center;gap:5px"><span class="ic">${IC.xCircle}</span>${ev.message}</span>`);
        }
      } catch {}
    }
  }

  const svcLabel = config.serviceLabel || config.service;
  const sub  = config.subscriptionId;
  const rg   = config.resourceGroup;

  const PORTAL_PATHS = {
    'apim':                 `Microsoft.ApiManagement/service/${config.params.apimName}`,
    'servicebus':           `Microsoft.ServiceBus/namespaces/${config.params.namespaceName}`,
    'eventhub':             `Microsoft.EventHub/namespaces/${config.params.namespaceName}`,
    'logicapp-consumption': `Microsoft.Logic/workflows/${config.params.logicAppName}`,
    'logicapp-standard':    `Microsoft.Web/sites/${config.params.logicAppName}`,
    'functionapp':          `Microsoft.Web/sites/${config.params.functionAppName}`,
    'keyvault':             `Microsoft.KeyVault/vaults/${config.params.keyVaultName}`,
    'eventgrid':            `Microsoft.EventGrid/topics/${config.params.topicName}`,
    'integrationaccount':   `Microsoft.Logic/integrationAccounts/${config.params.accountName}`,
  };
  const providerPath = PORTAL_PATHS[config.service];
  const portalLink = (sub && rg && providerPath)
    ? `https://portal.azure.com/#resource/subscriptions/${sub}/resourceGroups/${rg}/providers/${providerPath}/overview`
    : `https://portal.azure.com/#browse/resourcegroups`;

  if (succeeded) {
    addMessageFn('bot', `Deployment complete.\n\n<strong>${svcLabel}</strong> is live in resource group <strong>${rg}</strong> (${config.location}).\n\n<a href="${portalLink}" target="_blank" style="color:var(--accent2);text-decoration:underline">Open in Azure Portal →</a>`);
  } else {
    const errDetail = lastError ? `\n\n<span style="color:var(--error)">${lastError}</span>` : '';
    addMessageFn('bot', `Deployment failed.${errDetail}\n\nCheck the terminal output above for the full error. You can fix the issue and try deploying again.`);
  }
}

/** Build a multi-service deployment plan card */
export function buildPlanCard(configs, plan, addMessageFn, projectId) {
  const card = document.createElement('div');
  card.className = 'deploy-card plan-card';

  let serviceRows = '';
  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    const svcLabel = cfg.serviceLabel || cfg.service;
    serviceRows += `<div class="plan-service-row" data-index="${i}">
      <span class="plan-svc-label">${svcLabel}</span>
      <span class="plan-svc-status" id="plan-svc-status-${i}"><span class="ic">${IC.loader}</span> Pending</span>
    </div>`;
  }

  const firstCfg = configs[0] || {};
  card.innerHTML = `
    <div class="deploy-card-header"><span class="ic" style="margin-right:6px">${IC.rocket}</span>Deploying ${configs.length} service${configs.length > 1 ? 's' : ''}</div>
    <div class="deploy-params">
      <div class="param-row"><span class="param-key">Subscription</span><span class="param-val">${firstCfg.subscriptionName || firstCfg.subscriptionId || '—'}</span></div>
      <div class="param-row"><span class="param-key">Resource Group</span><span class="param-val">${firstCfg.resourceGroup || '—'}</span></div>
      <div class="param-row"><span class="param-key">Location</span><span class="param-val">${firstCfg.location || '—'}</span></div>
    </div>
    <div class="plan-services">${serviceRows}</div>
    <div class="deploy-actions"><span class="deploy-status" style="color:var(--warn);font-size:.83rem;display:inline-flex;align-items:center;gap:5px"><span class="ic">${IC.loader}</span>Starting deployment…</span></div>`;

  setTimeout(() => startPlanDeploy(configs, plan, card, addMessageFn, projectId), 100);
  return card;
}

/** Execute multi-service deployment */
async function startPlanDeploy(configs, plan, card, addMessageFn, projectId) {
  const statusEl = card.querySelector('.deploy-status');
  const setStatus = (html) => { if (statusEl) statusEl.innerHTML = html; };

  terminal.classList.add('open');
  termLog.innerHTML = '';
  scrollBottom();

  const res = await fetch('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ configs, projectId: projectId || activeProjectId })
  });

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = '';
  let   lastError = '';
  let   succeeded = false;
  let   totalSuccess = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const ev = JSON.parse(line.slice(6));
        const cls = ev.type === 'success' ? 'success' : ev.type === 'error' ? 'error' : ev.type === 'warn' ? 'warn' : '';
        if (ev.message) appendTermLog(ev.message, cls);

        // Per-service status updates
        if (ev.type === 'deploy_service_start') {
          const rowStatus = card.querySelector(`#plan-svc-status-${ev.index}`);
          if (rowStatus) rowStatus.innerHTML = `<span class="ic spin">${IC.loader}</span> Deploying…`;
        } else if (ev.type === 'deploy_service_complete') {
          totalSuccess++;
          const rowStatus = card.querySelector(`#plan-svc-status-${ev.index}`);
          if (rowStatus) rowStatus.innerHTML = `<span style="color:var(--success)">${IC.checkCircle} Done</span>`;
        } else if (ev.type === 'deploy_service_error') {
          lastError = ev.message;
          const rowStatus = card.querySelector(`#plan-svc-status-${ev.index}`);
          if (rowStatus) rowStatus.innerHTML = `<span style="color:var(--error)">${IC.xCircle} Failed</span>`;
        } else if (ev.type === 'success') {
          succeeded = true;
          setStatus(`<span style="color:var(--success);font-weight:700;display:inline-flex;align-items:center;gap:5px"><span class="ic">${IC.checkCircle}</span>All services deployed!</span>`);
        } else if (ev.type === 'warn' && ev.message?.includes('/')) {
          setStatus(`<span style="color:var(--warn);font-weight:700;display:inline-flex;align-items:center;gap:5px"><span class="ic">${IC.loader}</span>${ev.message}</span>`);
        } else if (ev.type === 'error') {
          lastError = ev.message;
          setStatus(`<span style="color:var(--error);display:inline-flex;align-items:center;gap:5px"><span class="ic">${IC.xCircle}</span>${ev.message}</span>`);
        } else if (ev.type === 'deploy_complete') {
          // Request post-deploy diagram
          if (plan?.length > 0) {
            try {
              const diagRes = await fetch('/api/diagram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, mode: 'deployed', deployResults: ev.deployResults })
              });
              const diagData = await diagRes.json();
              if (diagData.mermaid) showDiagramPanel(diagData.mermaid);
            } catch (e) { console.warn('[diagram] Post-deploy diagram failed:', e); }
          }
        }
      } catch {}
    }
  }

  const firstCfg = configs[0] || {};
  const rg = firstCfg.resourceGroup;
  const rgLink = `https://portal.azure.com/#browse/resourcegroups`;

  if (succeeded) {
    addMessageFn('bot', `Deployment complete.\n\n<strong>${configs.length} service${configs.length > 1 ? 's' : ''}</strong> deployed to resource group <strong>${rg}</strong> (${firstCfg.location}).\n\n<a href="${rgLink}" target="_blank" style="color:var(--accent2);text-decoration:underline">Open Resource Groups in Azure Portal →</a>`);
  } else if (totalSuccess > 0) {
    addMessageFn('bot', `Partial deployment: ${totalSuccess}/${configs.length} services succeeded.\n\nCheck the terminal output above for details on failures.`);
  } else {
    const errDetail = lastError ? `\n\n<span style="color:var(--error)">${lastError}</span>` : '';
    addMessageFn('bot', `Deployment failed.${errDetail}\n\nCheck the terminal output above for the full error.`);
  }
}
