import { IC } from './icons.js';
import {
  sessionId, activeModel, isStreaming, setStreaming,
  chatWrap, input, sendBtn, typing, welcome
} from './state.js';
import { scrollBottom, renderMd } from './helpers.js';
import { buildDeployCard } from './deploy.js';

const TEMPLATE_LABELS = {
  servicebus: 'Service Bus', eventhub: 'Event Hubs',
  'logicapp-standard': 'Logic App Standard', 'logicapp-consumption': 'Logic App Consumption',
  apim: 'APIM', functionapp: 'Function App', keyvault: 'Key Vault',
  eventgrid: 'Event Grid', integrationaccount: 'Integration Account'
};

/** Attach clickable choice chips below a message */
export function attachChoices(msgWrap, choices) {
  const old = msgWrap.querySelector('.choice-row');
  if (old) old.remove();

  const row = document.createElement('div');
  row.className = 'choice-row';

  choices.forEach(label => {
    const chip = document.createElement('button');
    chip.className = 'choice-chip';
    chip.textContent = label;
    chip.onclick = () => {
      row.querySelectorAll('.choice-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      row.classList.add('disabled');
      send(label);
    };
    row.appendChild(chip);
  });

  msgWrap.appendChild(row);
  scrollBottom();
}

/** Add a message to the chat */
export function addMessage(role, html) {
  if (welcome) welcome.style.display = 'none';
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
  scrollBottom();
  return bubble;
}

/** Streaming send */
export async function send(overrideText) {
  const text = overrideText || input.value.trim();
  if (!text || isStreaming) return;

  input.value = ''; input.style.height = 'auto';
  setStreaming(true); sendBtn.disabled = true;

  if (text !== '__learn__' && !text.startsWith('__template_')) addMessage('user', renderMd(text));
  else if (text === '__learn__') addMessage('user', 'I want to learn about Azure services');
  else { const svc = text.replace('__template_', '').replace(/__$/, ''); addMessage('user', `Explain the ${TEMPLATE_LABELS[svc] || svc} template`); }

  typing.style.display = 'flex';
  scrollBottom();

  // Create bot bubble (will be filled while streaming)
  if (welcome) welcome.style.display = 'none';
  const row    = document.createElement('div');
  row.className = 'msg-row bot';
  const avatar  = document.createElement('div');
  avatar.className = 'avatar bot'; avatar.innerHTML = IC.bot;
  const wrap    = document.createElement('div');
  const bubble  = document.createElement('div');
  bubble.className = 'bubble';
  const ts      = document.createElement('div');
  ts.className  = 'timestamp';
  ts.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  wrap.appendChild(bubble); wrap.appendChild(ts);
  row.appendChild(avatar); row.appendChild(wrap);
  chatWrap.insertBefore(row, typing);

  let rawText = '';
  let deployConfig = null;
  let pendingChoices = null;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId, model: activeModel })
    });

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buf     = '';

    typing.style.display = 'none';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const ev = JSON.parse(line.slice(6));
          if (ev.type === 'token') {
            rawText += ev.content;
            bubble.innerHTML = renderMd(rawText);
            scrollBottom();
          } else if (ev.type === 'choices') {
            pendingChoices = ev.choices;
          } else if (ev.type === 'deploy_config') {
            deployConfig = ev.config;
          } else if (ev.type === 'learn_link') {
            bubble.innerHTML += `<br><br><a href="${ev.url}" target="_blank" style="color:var(--accent2);font-size:.85rem;text-decoration:underline">Official documentation on Microsoft Learn →</a>`;
          } else if (ev.type === 'error') {
            bubble.innerHTML += `<br><span style="color:var(--error)">${ev.message}</span>`;
          }
        } catch {}
      }
    }

    if (deployConfig) bubble.appendChild(buildDeployCard(deployConfig, addMessage));
    if (pendingChoices) attachChoices(wrap, pendingChoices);

  } catch (err) {
    typing.style.display = 'none';
    bubble.innerHTML = `<span style="color:var(--error)">Connection error: ${err.message}</span>`;
  }

  setStreaming(false); sendBtn.disabled = false;
  scrollBottom();
  input.focus();
}

export function quickSend(t) { send(t); }
