'use strict';

const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const os       = require('os');
const { spawn, execSync } = require('child_process');

const app  = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const OLLAMA_EXE   = process.env.OLLAMA_EXE   ||
  (process.platform === 'win32'
    ? require('path').join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe')
    : 'ollama');
const MODULES_DIR  = path.join(__dirname, '..', 'modules');

// ── Load Bicep files for learn mode ──────────────────────────────────────────
function loadBicepContext() {
  const files = {};
  const serviceMap = {
    'servicebus': 'servicebus.bicep', 'eventhub': 'eventhub.bicep',
    'logicapp-consumption': 'logicapp-consumption.bicep', 'logicapp-standard': 'logicapp-standard.bicep',
    'apim': 'apim.bicep', 'functionapp': 'functionapp.bicep',
    'keyvault': 'keyvault.bicep', 'eventgrid': 'eventgrid.bicep',
    'integrationaccount': 'integrationaccount.bicep'
  };
  for (const [svc, file] of Object.entries(serviceMap)) {
    try {
      const raw = fs.readFileSync(path.join(MODULES_DIR, file), 'utf8');
      // Keep only param and resource lines — strip comments and blank lines
      const slim = raw.split('\n')
        .filter(l => /^\s*(param |resource |output |var )/.test(l) || /allowed\s*=/.test(l))
        .join('\n').trim();
      files[svc] = slim;
    } catch { files[svc] = '(template not found)'; }
  }
  return files;
}
const BICEP_TEMPLATES = loadBicepContext();

const LEARN_DOCS = {
  'servicebus':           'https://learn.microsoft.com/azure/service-bus-messaging/',
  'eventhub':             'https://learn.microsoft.com/azure/event-hubs/',
  'logicapp-consumption': 'https://learn.microsoft.com/azure/logic-apps/',
  'logicapp-standard':    'https://learn.microsoft.com/azure/logic-apps/',
  'apim':                 'https://learn.microsoft.com/azure/api-management/',
  'functionapp':          'https://learn.microsoft.com/azure/azure-functions/',
  'keyvault':             'https://learn.microsoft.com/azure/key-vault/',
  'eventgrid':            'https://learn.microsoft.com/azure/event-grid/',
  'integrationaccount':   'https://learn.microsoft.com/azure/logic-apps/logic-apps-enterprise-integration-create-integration-account'
};

const LEARN_INTENT_WORDS = [
  'what is','what are','explain','tell me about','how does','how do',
  'when should','when to use','difference between','compare','vs ','versus',
  'learn','understand','overview','help me understand','why would','what can'
];


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── AI-powered service detection (fallback when keyword match fails) ────────
async function detectServiceWithAI(message, model = OLLAMA_MODEL) {
  const descriptions = {
    'servicebus':           'message queuing, pub/sub, decoupling microservices, topics and queues',
    'eventhub':             'high-throughput event streaming, telemetry, real-time data ingestion, IoT',
    'logicapp-consumption': 'serverless workflow automation, connectors, pay per execution',
    'logicapp-standard':    'hosted workflow automation, dedicated compute, vnet support',
    'apim':                 'API gateway, rate limiting, developer portal, API management',
    'integrationaccount':   'B2B EDI integration, AS2, X12, EDIFACT, schemas and maps',
    'functionapp':          'serverless code, event-driven functions, background jobs',
    'keyvault':             'secrets management, certificates, encryption keys, credentials storage',
    'eventgrid':            'event routing, reactive architecture, serverless event handling',
  };
  const list = Object.entries(descriptions).map(([k,v]) => `${k}: ${v}`).join('\n');
  const prompt = `You are an Azure service classifier. Given a user message, return ONLY the service key that best matches what they want to deploy, or "none" if unclear.

Services:
${list}

User: "${message}"

Reply with ONLY the service key or "none". No explanation.`;
  try {
    const r = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.1 } })
    });
    const data = await r.json();
    const reply = (data.response || '').trim().toLowerCase().replace(/['"\s]/g, '');
    return SERVICE_LABELS[reply] ? reply : null;
  } catch { return null; }
}

// ── AI-powered value extraction (fallback when pattern matching fails) ────────
async function extractValueWithAI(param, message, subs, model = OLLAMA_MODEL) {
  let prompt = '';
  if (param.type === 'choice') {
    prompt = `The user was asked to pick one of: [${param.choices.join(', ')}]\nThey said: "${message}"\nReturn ONLY the exact matching option, or "none" if no match.`;
  } else if (param.type === 'text') {
    prompt = `The user was asked: "${param.label}"\nThey replied: "${message}"\nExtract and return ONLY the value they provided. Return "none" if no clear value.`;
  } else if (param.type === 'subscription') {
    const names = subs.map(s => s.name).join(', ');
    prompt = `Pick the best matching Azure subscription from: [${names}]\nBased on: "${message}"\nReturn ONLY the exact subscription name or "none".`;
  } else { return null; }

  try {
    const r = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.1 } })
    });
    const data = await r.json();
    const reply = (data.response || '').trim();
    if (!reply || reply.toLowerCase() === 'none') return null;
    if (param.type === 'choice') {
      return param.choices.find(c => c.toLowerCase() === reply.toLowerCase()) || null;
    }
    if (param.type === 'subscription') {
      return subs.find(s => s.name.toLowerCase() === reply.toLowerCase()) || null;
    }
    if (param.validate) { const err = param.validate(reply); if (err) return null; }
    return reply;
  } catch { return null; }
}

// ── In-memory session store ──────────────────────────────────────────────────
const sessions = new Map();

// ── System prompt (simple — state machine does the heavy lifting) ─────────────
const SYSTEM_PROMPT = `You are DeploX, a friendly Azure deployment assistant built by Ahmed Bayoumy.
You help users deploy Azure integration services through natural conversation.
Be concise, warm and helpful. Understand what users mean even when they don't use exact Azure terms.
When you receive a DIRECTIVE, follow it precisely and ask that one thing naturally.
Never ask more than one question at a time. Acknowledge answers briefly before continuing.`;

// ── Parameter schemas ─────────────────────────────────────────────────────────
const LOCATIONS = ['swedencentral','westeurope','northeurope','eastus','eastus2','westus','westus2','uksouth','ukwest','australiaeast','southeastasia','japaneast','centralus'];

const SERVICE_SCHEMAS = {
  'servicebus': [
    { key:'namespaceName', label:'Service Bus namespace name', type:'text',
      q:'Name for the Service Bus namespace? (6–50 chars, letters/numbers/hyphens)\nMust be globally unique — include your org/project, e.g. contoso-myapp-bus',
      validate: v => v.length < 6 || v.length > 50 ? 'Must be 6–50 characters.' : /[^a-zA-Z0-9-]/.test(v) ? 'Only letters, numbers and hyphens allowed.' : null },
    { key:'sku',    label:'SKU', type:'choice', choices:['Standard','Premium','Basic'],
      q:'Which SKU?\n• Basic — queues only, lowest cost\n• Standard — queues + topics, most common\n• Premium — dedicated capacity, VNet support' },
    { key:'queues', label:'queues to create', type:'list_optional',
      q:'Any queues to pre-create? Enter names comma-separated, or click Skip.' },
    { key:'topics', label:'topics to create', type:'list_optional',
      q:'Any topics to pre-create? Enter names comma-separated, or click Skip.',
      skipIf: c => c.sku === 'Basic', skipMsg: '[!] Basic SKU does not support topics — skipping.' },
  ],

  'eventhub': [
    { key:'namespaceName', label:'Event Hubs namespace name', type:'text',
      q:'Name for the Event Hubs namespace? (6–50 chars, letters/numbers/hyphens)\nMust be globally unique — include your org/project, e.g. contoso-myapp-eh',
      validate: v => v.length < 6 || v.length > 50 ? 'Must be 6–50 characters.' : /[^a-zA-Z0-9-]/.test(v) ? 'Only letters, numbers and hyphens allowed.' : null },
    { key:'sku', label:'SKU', type:'choice', choices:['Basic','Standard','Premium'],
      q:'Which SKU?\n• Basic — single consumer group, no capture\n• Standard — multiple consumer groups, 20 connections\n• Premium — dedicated capacity, private endpoints' },
    { key:'eventHubs', label:'event hubs to create', type:'list_optional',
      q:'Any event hub instances to pre-create? Enter names comma-separated, or click Skip.' },
    { key:'messageRetentionInDays', label:'message retention (days)', type:'choice',
      choices:['1','3','7'], paramType:'int',
      q:'How many days to retain messages? (Basic: max 1 day, Standard/Premium: up to 7)',
      skipIf: c => !c.eventHubs?.length, skipMsg: '[~] No event hubs to create — skipping retention setting.' },
  ],

  'logicapp-consumption': [
    { key:'logicAppName', label:'Logic App name', type:'text',
      q:'Name for the Logic App (Consumption)? (2–80 chars, letters/numbers/hyphens)',
      validate: v => v.length < 2 || v.length > 80 ? 'Must be 2–80 characters.' : null },
    { key:'integrationAccountId', label:'Integration Account resource ID', type:'text_optional',
      q:'Link an Integration Account? Paste the full resource ID, or click Skip.' },
  ],

  'logicapp-standard': [
    { key:'logicAppName', label:'Logic App name', type:'text',
      q:'Name for the Logic App (Standard)? (2–60 chars)',
      validate: v => v.length < 2 || v.length > 60 ? 'Must be 2–60 characters.' : null },
    { key:'storageAccountName', label:'storage account name', type:'text',
      q:'Storage account name for the Logic App runtime? (3–24 lowercase letters/numbers, must be globally unique — e.g. myorg2024logicstore)',
      validate: v => /[^a-z0-9]/.test(v) || v.length < 3 || v.length > 24 ? 'Must be 3–24 lowercase letters and numbers only.' : null },
    { key:'skuName', label:'plan size', type:'choice', choices:['WS1','WS2','WS3'],
      q:'Which hosting plan?\n• WS1 — 1 core, 3.5 GB RAM\n• WS2 — 2 cores, 7 GB RAM\n• WS3 — 4 cores, 14 GB RAM' },
    { key:'__codePath', label:'workflows folder', type:'text',
      q:'Path to your local Logic App workflows folder? (e.g. C:\\Projects\\my-logicapp)\nLeave blank to skip code deployment and only create the infrastructure.',
      validate: () => null },
  ],

  'apim': [
    { key:'apimName', label:'API Management service name', type:'text',
      q:'Name for the API Management service?\n• 1–50 chars, letters/numbers/hyphens, must start with a letter\n• Must be globally unique across Azure\n• Best practice: include org + purpose, e.g. contoso-integration-apim',
      validate: v => v.length < 1 || v.length > 50 ? 'Must be 1–50 characters.' : !/^[a-zA-Z]/.test(v) ? 'Must start with a letter.' : /[^a-zA-Z0-9-]/.test(v) ? 'Only letters, numbers and hyphens allowed.' : null },
    { key:'publisherEmail', label:'publisher email', type:'text',
      q:'Publisher email address? (used for system notifications)',
      validate: v => !v.includes('@') ? 'Please enter a valid email address.' : null },
    { key:'publisherName', label:'publisher name', type:'text',
      q:'Publisher organisation or name? (shown in the developer portal)' },
    { key:'sku', label:'SKU', type:'choice',
      choices:['Consumption','Developer','Basic','Standard','Premium'],
      q:'Which SKU?\n• Consumption — serverless, pay-per-call, no VNet, fastest to deploy\n• Developer — dev/test only, no SLA, ~30–45 min to provision\n• Basic — production, SLA, ~30–45 min to provision\n• Standard — production + more scale, ~30–45 min to provision\n• Premium — multi-region, VNet integration, ~30–45 min to provision\n[!] All tiers except Consumption take 30–45 minutes to deploy.' },
    { key:'rateLimitCallsPerMinute', label:'rate limit (calls/min)', type:'text', paramType:'int',
      defaultValue: '60',
      q:'Rate limit per client IP — max calls per minute?\n• Recommended: 60 for dev/test, 300–1000 for production APIs\n• Too low = legitimate users get blocked; too high = no protection\n• Applies globally across all APIs in this template\n• Press Enter to use default (60)',
      validate: v => (isNaN(parseInt(v)) || parseInt(v) < 1) ? 'Please enter a positive number.' : null },
    { key:'corsAllowedOrigins', label:'CORS allowed origins', type:'text',
      defaultValue: '*',
      q:'CORS allowed origins?\n• * = allow all origins (convenient for dev, risky for production)\n• Production best practice: specify exact domain, e.g. https://myapp.com\n• Multiple domains not supported in this template — use * or one domain\n• Press Enter to use default (*)' },
  ],

  'integrationaccount': [
    { key:'integrationAccountName', label:'Integration Account name', type:'text',
      q:'Name for the Integration Account? (1–80 chars)',
      validate: v => v.length < 1 || v.length > 80 ? 'Must be 1–80 characters.' : null },
    { key:'sku', label:'SKU', type:'choice', choices:['Free','Basic','Standard'],
      q:'Which SKU?\n• Free — limited messages, dev/test only\n• Basic — B2B tracking, AS2/X12/EDIFACT\n• Standard — full EDI, maps, schemas, partner management' },
  ],

  'functionapp': [
    { key:'functionAppName', label:'Function App name', type:'text',
      q:'Name for the Function App? (2–60 chars)',
      validate: v => v.length < 2 || v.length > 60 ? 'Must be 2–60 characters.' : null },
    { key:'storageAccountName', label:'storage account name', type:'text',
      q:'Storage account name for the Function App? (3–24 lowercase letters/numbers, must be globally unique — e.g. myorg2024funcstore)',
      validate: v => /[^a-z0-9]/.test(v) || v.length < 3 || v.length > 24 ? 'Must be 3–24 lowercase letters and numbers only.' : null },
    { key:'runtime', label:'runtime', type:'choice',
      choices:['dotnet','dotnet-isolated','node','python','java'],
      q:'Which runtime?\n• dotnet / dotnet-isolated — C# functions\n• node — JavaScript/TypeScript\n• python — Python functions\n• java — Java functions' },
    { key:'__codePath', label:'function code folder', type:'text',
      q:'Path to your local function code folder to deploy? (e.g. C:\\Projects\\my-func)\nLeave blank to skip code deployment and only create the infrastructure.',
      validate: () => null },
  ],

  'keyvault': [
    { key:'keyVaultName', label:'Key Vault name', type:'text',
      q:'Name for the Key Vault? (3–24 chars, letters/numbers/hyphens, must start with a letter)',
      validate: v => v.length < 3 || v.length > 24 ? 'Must be 3–24 characters.' : /[^a-zA-Z0-9-]/.test(v) ? 'Only letters, numbers and hyphens allowed.' : null },
    { key:'sku', label:'SKU', type:'choice', choices:['standard','premium'],
      q:'Which SKU?\n• standard — software-protected keys\n• premium — HSM-backed keys (higher cost)' },
  ],

  'eventgrid': [
    { key:'topicName', label:'Event Grid topic name', type:'text',
      q:'Name for the Event Grid topic? (3–50 chars)',
      validate: v => v.length < 3 || v.length > 50 ? 'Must be 3–50 characters.' : null },
  ],
};

const COMMON_SCHEMA = [
  { key:'__subscription', label:'Azure subscription',  type:'subscription', q:'' }, // auto-filled, never asked
  { key:'__rgPick',       label:'resource group',      type:'rg_select',    q:'Select an existing resource group or create a new one:' },
  { key:'__rgName',       label:'resource group name', type:'text',         q:'What name for the new resource group? (1–90 chars, letters/numbers/hyphens/underscores/periods)',
    validate: v => (v.length < 1 || v.length > 90) ? 'Name must be 1–90 characters.' : null },
  { key:'__location',     label:'Azure region',        type:'choice', choices:LOCATIONS, q:'Which Azure region do you want to deploy to?' },
  { key:'__env',          label:'environment tag',     type:'choice', choices:['dev','test','prod'], q:'Which environment is this for?' },
];

const SERVICE_LABELS = {
  'servicebus':'Service Bus', 'eventhub':'Event Hubs',
  'logicapp-consumption':'Logic App Consumption', 'logicapp-standard':'Logic App Standard',
  'apim':'API Management', 'integrationaccount':'Integration Account',
  'functionapp':'Function App', 'keyvault':'Key Vault', 'eventgrid':'Event Grid'
};

const SERVICE_KEYWORDS = {
  'servicebus':['service bus','servicebus'],
  'eventhub':['event hub','eventhub'],
  'logicapp-standard':['logic app standard','standard logic app','logic app standard'],
  'logicapp-consumption':['logic app consumption','consumption logic app','logic app consumption'],
  'apim':['api management','apim','api gateway'],
  'integrationaccount':['integration account','b2b','edi'],
  'functionapp':['function app','functionapp','azure function','functions'],
  'keyvault':['key vault','keyvault'],
  'eventgrid':['event grid','eventgrid'],
};

// ── State machine helpers ─────────────────────────────────────────────────────

function detectService(msg) {
  const lower = msg.toLowerCase();
  for (const [svc, keywords] of Object.entries(SERVICE_KEYWORDS))
    if (keywords.some(k => lower.includes(k))) return svc;
  return null;
}

function extractValue(param, msg, subs) {
  const lower = msg.toLowerCase().trim();
  if (param.type === 'choice') {
    for (const c of param.choices)
      if (lower === c.toLowerCase() || lower.includes(c.toLowerCase())) return c;
    return null;
  }
  if (param.type === 'subscription') {
    for (const s of subs)
      if (lower.includes(s.name.toLowerCase()) || lower.includes(s.id.toLowerCase())) return s;
    return null;
  }
  if (param.type === 'list_optional') {
    if (['skip','no','none','n/a','','ok','yes','sure','next','proceed'].includes(lower)) return [];
    return msg.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (param.type === 'text_optional') {
    if (['skip','no','none','n/a',''].includes(lower)) return '';
    return msg.trim();
  }
  if (param.type === 'rg_select') {
    const val = msg.trim();
    return val.length ? val : null;
  }
  if (param.type === 'text') {
    if (param.defaultValue !== undefined && msg.trim().startsWith('Use default (')) return String(param.defaultValue);
    if (['ok','yes','no','sure','next','skip','proceed'].includes(lower)) return null;
    const val = msg.trim();
    if (!val.length) return null;
    // Run inline validation if defined
    if (param.validate) {
      const err = param.validate(val);
      if (err) return { __invalid: true, reason: err };
    }
    return val;
  }
  return null;
}

/** Returns a validation error string, or null if valid */
function validationError(extracted) {
  return (extracted && typeof extracted === 'object' && extracted.__invalid) ? extracted.reason : null;
}

function currentParam(session) {
  // Advance past any params whose skipIf condition is now true
  while (session.schemaIdx < session.schema.length) {
    const p = session.schema[session.schemaIdx];
    if (p.skipIf && p.skipIf(session.collected)) {
      if (p.skipMsg) session._skipMsgs = [...(session._skipMsgs || []), p.skipMsg];
      session.schemaIdx++;
    } else {
      break;
    }
  }
  return session.schema[session.schemaIdx] || null;
}

/** Build schema for a service, filtering out params already collected (e.g. pre-filled subscription) */
function buildSchema(svc, collected) {
  return [...(SERVICE_SCHEMAS[svc] || []), ...COMMON_SCHEMA]
    .filter(p => !(p.key in collected))
    .map(p => ({ ...p })); // copy each param so _retryMsg mutations never pollute the global schema
}

/** Infer environment tag from a subscription name */
function inferEnv(subName = '') {
  const n = subName.toLowerCase();
  return n.includes('prod') ? 'prod'
       : n.includes('test') || n.includes('stag') ? 'test'
       : n.includes('dev')  ? 'dev'
       : null;
}

function buildDirective(param, subs) {
  if (!param) return 'Summarise the deployment and ask the user to confirm.';
  let d = `DIRECTIVE: Ask the user for their ${param.label}.`;
  if (param.type === 'subscription') {
    const names = subs.map(s => `"${s.name}"`).join(', ');
    d = `DIRECTIVE: Ask the user to pick their Azure subscription by clicking one of the buttons. List them as: ${names}. Do NOT ask yes/no questions.`;
  } else if (param.key === '__rgPick') {
    d = 'DIRECTIVE: Ask the user to select a resource group from the buttons below, or click "➕ Create new" to enter a new name.';
  } else if (param.key === '__rgName') {
    d = 'DIRECTIVE: Ask the user for the resource group name. Mention it will be created if it doesn\'t exist.';
  } else if (param.key === '__location') {
    d = 'DIRECTIVE: Ask the user to pick an Azure region by clicking one of the buttons shown below.';
  } else if (param.type === 'list_optional' || param.type === 'text_optional') {
    d += ' They can type values or click Skip.';
  }
  return d;
}

function choicesForParam(param, subs, session) {
  if (!param) return ['Yes, deploy','Cancel'];
  if (param.type === 'subscription') return subs.map(s => s.name);
  if (param.type === 'choice') return param.choices;
  if (param.type === 'rg_select') {
    const sub   = session?.collected?.__subscription;
    const subId = sub ? (typeof sub === 'object' ? sub.id : sub) : null;
    const args  = subId ? ['group', 'list', '--subscription', subId] : ['group', 'list'];
    const rgs   = azJson(args) || [];
    return [...rgs.map(rg => rg.name).sort(), '+ Create new'];
  }
  if (param.type === 'list_optional' || param.type === 'text_optional') return ['Skip'];
  if (param.type === 'text' && param.defaultValue !== undefined) return [`Use default (${param.defaultValue})`];
  return null;
}

function buildDeployConfig(session) {
  const { service, collected } = session;
  const sub     = collected.__subscription || {};
  const subId   = typeof sub === 'object' ? (sub.id   || '') : sub;
  const subName = typeof sub === 'object' ? (sub.name || subId) : sub;
  const serviceParams = {};
  for (const [k, v] of Object.entries(collected))
    if (!k.startsWith('__')) serviceParams[k] = v;
  const firstName = Object.values(serviceParams)[0] || 'deploy';
  return {
    service,
    serviceLabel:        SERVICE_LABELS[service] || service,
    subscriptionId:      subId,
    subscriptionName: subName,
    resourceGroup:       collected.__rgName || 'my-rg',
    createResourceGroup: true,
    location:            collected.__location || 'westeurope',
    deploymentName:      `${service}-${String(firstName).replace(/[^a-z0-9-]/gi,'-').slice(0,20)}`,
    params:              serviceParams,
    codePath:            collected.__codePath?.trim() || null,
    tags: { Environment: collected.__env || 'dev', CreatedBy: 'DeploX' }
  };
}

function makeSummary(session) {
  const { service, collected } = session;
  const sub     = collected.__subscription;
  const subName = typeof sub === 'object' ? sub.name : (sub || '—');
  const lines = [
    `Service: ${SERVICE_LABELS[service] || service}`,
    `Subscription: ${subName}`,
    `Resource Group: ${collected.__rgName || '—'}`,
    `Location: ${collected.__location || '—'}`,
    `Environment: ${collected.__env || '—'}`,
  ];
  for (const [k, v] of Object.entries(collected)) {
    if (k.startsWith('__') && k !== '__codePath') continue;
    if (k === '__codePath') { if (v?.trim()) lines.push(`Code folder: ${v.trim()}`); continue; }
    lines.push(`${k}: ${Array.isArray(v) ? (v.length ? v.join(', ') : '(none)') : v}`);
  }
  return lines.join('\n');
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Returns a short readable label from a camelCase param key
function paramLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

// Returns edit-choice buttons: "Edit: <label>" for every schema param
function editableChoices(session) {
  const schema = session.schema || [];
  return schema
    .filter(p => !p.key.startsWith('__') || ['__location','__rgName','__env'].includes(p.key))
    .map(p => {
      const label = p.editLabel || paramLabel(p.key.replace(/^__/, ''));
      const current = session.collected[p.key];
      const display = current ? `${label}: ${Array.isArray(current)?current.join(', '):current}` : label;
      return `Edit: ${display}`;
    });
}

// Find schema param by key
function findParamByKey(session, key) {
  return (session.schema || []).find(p => p.key === key);
}


/** Extract the first balanced JSON object from a string */
function extractFirstJson(str) {
  const start = str.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}

/** Run az CLI and return parsed JSON output, or null on error */
function azJson(args) {
  try {
    return JSON.parse(execSync(`az ${args.join(' ')} --output json 2>nul`, { timeout: 15000 }).toString());
  } catch {
    return null;
  }
}

/** SSE helper */
function sse(res, type, payload = {}) {
  res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
}

// ── Routes ───────────────────────────────────────────────────────────────────

/** Azure context: subscriptions + common locations */
app.get('/api/azure/context', (_req, res) => {
  const subs = azJson(['account', 'list']) || [];
  res.json({
    subscriptions: subs.map(s => ({ id: s.id, name: s.name, isDefault: s.isDefault })),
    locations: [
      'swedencentral','westeurope','northeurope','eastus','eastus2','westus','westus2',
      'uksouth','ukwest','australiaeast','southeastasia','japaneast','centralus'
    ]
  });
});

/** Current logged-in account + active subscription */
app.get('/api/azure/account', (_req, res) => {
  const account = azJson(['account', 'show']);
  if (!account) return res.json({ loggedIn: false });
  res.json({
    loggedIn: true,
    user:         account.user?.name || 'unknown',
    userType:     account.user?.type || 'user',
    subscription: { id: account.id, name: account.name },
    tenant:       account.tenantId
  });
});

/** Login — opens browser, streams progress via SSE */
app.post('/api/azure/login', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const args = ['login'];
  // Support --tenant if provided
  if (req.body?.tenant) args.push('--tenant', req.body.tenant);

  sse(res, 'log', { message: 'Opening browser for Azure login...' });
  const proc = spawn('az', args, { shell: true });
  proc.stdout.on('data', d => sse(res, 'log',  { message: d.toString().trimEnd() }));
  proc.stderr.on('data', d => sse(res, 'log',  { message: d.toString().trimEnd() }));
  proc.on('close', code => {
    if (code === 0) {
      const account = azJson(['account', 'show']);
      sse(res, 'success', {
        message: `Logged in as ${account?.user?.name || 'unknown'}`,
        account: account ? {
          user: account.user?.name,
          subscription: { id: account.id, name: account.name }
        } : null
      });
    } else {
      sse(res, 'error', { message: 'Login failed or was cancelled.' });
    }
    res.end();
  });
});

/** Logout */
app.post('/api/azure/logout', (_req, res) => {
  try {
    execSync('az logout', { timeout: 10000 });
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

/** Set active subscription */
app.post('/api/azure/subscription', (req, res) => {
  const { subscriptionId } = req.body;
  if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });
  try {
    execSync(`az account set --subscription ${subscriptionId}`, { timeout: 10000 });
    const account = azJson(['account', 'show']);
    res.json({ ok: true, subscription: { id: account.id, name: account.name } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Ollama status */
app.get('/api/ollama/status', async (_req, res) => {
  try {
    const r    = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await r.json();
    const models = (data.models || []).map(m => m.name);
    res.json({ running: true, models, activeModel: OLLAMA_MODEL, hasModel: models.some(m => m.startsWith(OLLAMA_MODEL)) });
  } catch {
    res.json({ running: false, models: [], hasModel: false });
  }
});

/** Chat — state-machine driven, streams tokens via SSE */
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, model } = req.body;
  if (!message || !sessionId) return res.status(400).json({ error: 'message and sessionId required' });

  // ── Bootstrap session ──────────────────────────────────────────────────────
  if (!sessions.has(sessionId)) {
    const subs       = azJson(['account', 'list']) || [];
    const defaultSub = subs.find(s => s.isDefault) || subs[0] || null;
    const autoEnv    = inferEnv(defaultSub?.name);

    const preCollected = {};
    if (defaultSub) preCollected.__subscription = defaultSub;
    if (autoEnv)    preCollected.__env           = autoEnv;

    sessions.set(sessionId, {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      state:    'start',
      service:  null,
      schema:   [],
      schemaIdx: 0,
      collected: preCollected,
      subs
    });
  }

  const session = sessions.get(sessionId);
  // Update active model if user changed it in UI
  if (model) session.model = model;
  const activeModel = session.model || OLLAMA_MODEL;
  const { subs } = session;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // ── State machine: process user message ───────────────────────────────────
  let directive = '';
  let nextChoices = null;
  let useOllamaForRetry = false;

  if (session.state === 'start') {
    // Check for learn intent before trying to deploy
    const lowerMsg = message.toLowerCase();
    const isLearnIntent = LEARN_INTENT_WORDS.some(w => lowerMsg.includes(w))
      && !['deploy','create','set up','provision','spin up','i want to deploy','lets deploy'].some(w => lowerMsg.includes(w));

    if (isLearnIntent || message === '__learn__') {
      session.state = 'learning';
      session._learnService = detectService(message) || null;
      const bicepSnippet = session._learnService ? BICEP_TEMPLATES[session._learnService] : '';
      const templateNote = bicepSnippet
        ? `

DeploX template for this service (Bicep source):
\`\`\`
${bicepSnippet}
\`\`\``
        : '';
      directive = `You are DeploX, an Azure integration services assistant. Answer the user's question about Azure services clearly and professionally. Be concise but thorough. Focus on practical use cases, when to choose this service, and key concepts. If asked about the DeploX template, explain what it deploys based on the Bicep source provided.${templateNote}

DIRECTIVE: Answer the user's question. Do not mention deploying unless the user asks about it.`;
    } else {
    // Try to detect service from first message
    let svc = detectService(message);
    if (!svc) svc = await detectServiceWithAI(message, activeModel);
    if (svc) {
      // Don't jump straight to collecting — confirm understanding first
      session._pendingService = svc;
      session.state = 'confirming_service';
      const svcLabel = SERVICE_LABELS[svc] || svc;
      directive = `DIRECTIVE: The user described what they want and you identified it as "${svcLabel}". In 2-3 professional sentences: (1) restate what the user wants to achieve in your own words, (2) confirm that ${svcLabel} is the right Azure service for this need, (3) give one concrete reason why it is a good fit. End by asking if they want to proceed with deploying ${svcLabel}.`;
      nextChoices = [`Yes, deploy ${svcLabel}`, 'Choose a different service'];
    } else {
      // Ask user to pick a service
      directive   = 'DIRECTIVE: Welcome the user and ask what Azure integration service they want to deploy.';
      nextChoices = Object.values(SERVICE_LABELS);
    }
    } // end isLearnIntent else

  } else if (session.state === 'learning') {
    // User is in learn mode — check if they want to deploy or keep learning
    const lowerMsg = message.toLowerCase();
    const wantsDeploy = message.startsWith('Deploy ') || ['deploy now','yes deploy','i want to deploy','lets deploy','go ahead and deploy'].some(w => lowerMsg.includes(w));
    const svcFromBtn  = message.startsWith('Deploy ') ? detectService(message.replace(/^Deploy\s+/i,'')) : null;

    if (wantsDeploy) {
      const svc = svcFromBtn || session._learnService || detectService(message) || await detectServiceWithAI(message, activeModel);
      if (svc) {
        session._pendingService = svc;
        session.state = 'confirming_service';
        delete session._learnService;
        const svcLabel = SERVICE_LABELS[svc] || svc;
        directive = `DIRECTIVE: The user wants to deploy "${svcLabel}". Confirm your understanding, briefly say why it is a good fit, and ask if they want to proceed.`;
        nextChoices = [`Yes, deploy ${svcLabel}`, 'Choose a different service'];
      } else {
        directive = 'DIRECTIVE: Ask the user which Azure service they would like to deploy.';
        nextChoices = Object.values(SERVICE_LABELS);
      }
    } else {
      // Continue learning — update context if a new service is mentioned
      const mentionedSvc = detectService(message) || await detectServiceWithAI(message, activeModel);
      if (mentionedSvc) session._learnService = mentionedSvc;
      const bicepSnippet = session._learnService ? BICEP_TEMPLATES[session._learnService] : '';
      const templateNote = bicepSnippet
        ? `

DeploX template (Bicep source):
\`\`\`
${bicepSnippet}
\`\`\``
        : '';
      const docsLink = session._learnService ? LEARN_DOCS[session._learnService] : null;
      session._pendingLearnLink = docsLink || null;
      directive = `You are DeploX, an Azure integration services assistant. Answer clearly and professionally. Be concise but thorough.${templateNote}

DIRECTIVE: Answer the user's question about Azure services. Do not push them to deploy.`;
    }

  } else if (session.state === 'confirming_service') {
    const svc      = session._pendingService;
    const svcLabel = SERVICE_LABELS[svc] || svc;
    const msg      = message.toLowerCase();
    const confirmed = msg.includes('yes') || msg.includes('proceed') || msg.includes('go ahead')
                   || msg.includes('deploy') || msg.includes('correct') || msg.includes('right');
    const rejected  = msg.includes('no') || msg.includes('different') || msg.includes('change')
                   || msg.includes('other') || msg.includes('cancel');
    if (confirmed) {
      session.service   = svc;
      session.schema    = buildSchema(svc, session.collected);
      session.schemaIdx = 0;
      session.state     = 'collecting';
      delete session._pendingService;
      const param = currentParam(session);
      directive   = buildDirective(param, subs);
      nextChoices = choicesForParam(param, subs, session);
    } else if (rejected) {
      delete session._pendingService;
      session.state = 'start';
      directive   = 'DIRECTIVE: The user wants to choose a different service. Ask them what Azure service they would like to deploy.';
      nextChoices = Object.values(SERVICE_LABELS);
    } else {
      // Ambiguous — let Ollama re-ask
      directive   = `DIRECTIVE: The user's response was unclear. Re-confirm in one sentence: did they mean to deploy "${svcLabel}"? Ask them to confirm yes or choose a different service.`;
      nextChoices = [`Yes, deploy ${svcLabel}`, 'Choose a different service'];
    }

  } else if (session.state === 'collecting') {
    const param = currentParam(session);
    // Only allow service switching at choice/button steps, not during free-text entry
    // (prevents e.g. 'my-apim-service' from re-triggering APIM detection and resetting)
    const isFreeText = param && (param.type === 'text' || param.type === 'text_optional' || param.type === 'rg_select');

    // Explicit "Change service" escape hatch — always allowed
    const wantsChangeService = message === 'Change service'
      || (!isFreeText && /\b(change service|different service|wrong service|start over|restart|never mind)\b/i.test(message));
    if (wantsChangeService) {
      delete session._pendingService;
      session.service = null; session.schema = []; session.schemaIdx = 0; session.collected = {};
      session.state = 'start';
      directive   = 'DIRECTIVE: The user wants to choose a different Azure service. Acknowledge briefly and ask what they would like to deploy instead.';
      nextChoices = Object.values(SERVICE_LABELS);
    } else {
    const switchSvc = !isFreeText && detectService(message);
    if (switchSvc) {
      session.service   = switchSvc;
      session.schema    = buildSchema(switchSvc, session.collected);
      session.schemaIdx = 0;
      // fall through — state stays 'collecting', first question sent below
    } else {
    if (param) {
      const value   = extractValue(param, message, subs);
      const valErr  = validationError(value);

      if (valErr) {
        // Invalid input — show clear error with the constraint that was violated
        directive   = '';
        nextChoices = choicesForParam(param, subs, session);
        param._retryMsg = `❌ Invalid input: ${valErr}\n\nPlease try again — ${param.q}`;
      } else if (value !== null) {
        session.collected[param.key] = value;
        session.schemaIdx++;
        delete param._retryMsg;
        // If user picked an existing RG, auto-fill __rgName and skip the text question
        if (param.key === '__rgPick' && value !== '+ Create new') {
          session.collected.__rgName = value;
          if (session.schema[session.schemaIdx]?.key === '__rgName') {
            session.schemaIdx++;
          }
        }
      } else if (param.defaultValue !== undefined && !message.trim()) {
        // Truly empty input on a field with a default — accept the default
        session.collected[param.key] = String(param.defaultValue);
        session.schemaIdx++;
        delete param._retryMsg;
      } else {
        // AI fallback: user typed something but pattern matching didn't understand it
        const aiValue = await extractValueWithAI(param, message, subs, activeModel);
        if (aiValue !== null) {
          session.collected[param.key] = typeof aiValue === 'object' ? aiValue : String(aiValue);
          session.schemaIdx++;
          delete param._retryMsg;
          if (param.key === '__rgPick' && aiValue !== '+ Create new') {
            session.collected.__rgName = aiValue;
            if (session.schema[session.schemaIdx]?.key === '__rgName') session.schemaIdx++;
          }
        }
        // if still null — re-ask naturally via Ollama instead of raw question text
        else {
          directive = `DIRECTIVE: The user seems unsure. Gently re-ask them for their ${param.label}. Remind them: ${param.q}`;
          nextChoices = choicesForParam(param, subs, session);
          useOllamaForRetry = true;
        }
      }

      const next = currentParam(session);
      if (!next) {
        session.state = 'confirm';
        nextChoices   = ['Yes, deploy', 'Cancel'];
      } else {
        directive   = '';  // direct text mode
        nextChoices = choicesForParam(next, subs, session);
      }
    }
    } // end else (not a service switch)
    } // end wantsChangeService else

  } else if (session.state === 'confirm') {
    const lower = message.toLowerCase();
    if (message === 'Change service' || /\b(change service|different service|start over)\b/i.test(lower)) {
      delete session._pendingService;
      session.service = null; session.schema = []; session.schemaIdx = 0; session.collected = {};
      session.state = 'start';
      directive   = 'DIRECTIVE: The user wants to deploy a different Azure service. Ask them what they would like to deploy.';
      nextChoices = Object.values(SERVICE_LABELS);
    } else if (message === 'Edit a setting' || /\b(edit|change|modify|update|fix)\b/i.test(lower)) {
      session.state = 'editing';
      session._editingKey = null;
      nextChoices = editableChoices(session);
    } else if (['yes','ok','go','deploy','sure','proceed'].some(k => lower.includes(k))) {
      const config = buildDeployConfig(session);
      session.state = 'done';
      // Use direct text — never let the model guess deployment status
      const svcLabel = SERVICE_LABELS[session.service] || session.service;
      const deployingText = `Deployment initiated...\n\nDeploying — ${svcLabel}\nSubscription: ${config.subscriptionName || '—'}\nResource Group: ${config.resourceGroup || '—'}\nLocation: ${config.location || '—'}\n\nThis may take a few minutes. You will see the result below.`;
      sse(res, 'deploy_config', { config });
      session.messages.push({ role: 'user', content: message });
      session.messages.push({ role: 'assistant', content: deployingText });
      sse(res, 'token', { content: deployingText });
      sse(res, 'done');
      return res.end();
    } else {
      // Unrecognised — re-show summary
      nextChoices = ['Yes, deploy', 'Edit a setting', 'Change service'];
    }

  } else if (session.state === 'editing') {
    if (!session._editingKey) {
      // Pick mode — user clicked "Edit: <label>: <value>", extract the param key
      // Button format: "Edit: <Label>: <current>" or "Edit: <Label>"
      const stripped = message.replace(/^Edit:\s*/i, '').split(':')[0].trim();
      const found = (session.schema || []).find(p => {
        const label = p.editLabel || paramLabel(p.key.replace(/^__/, ''));
        return label.toLowerCase() === stripped.toLowerCase();
      });
      if (found) {
        session._editingKey = found.key;
        delete found._retryMsg;
        nextChoices = choicesForParam(found, subs, session);
      } else {
        // Unrecognised — re-show list
        nextChoices = editableChoices(session);
      }
    } else {
      // Value entry mode — validate then save
      const key   = session._editingKey;
      const param = findParamByKey(session, key);
      if (param) {
        const value  = extractValue(param, message, subs);
        const valErr = validationError(value);
        if (valErr) {
          param._retryMsg = `❌ Invalid input: ${valErr}\n\nPlease try again — ${param.q}`;
          nextChoices = choicesForParam(param, subs, session);
        } else if (value !== null) {
          session.collected[key] = value;
          delete param._retryMsg;
          delete session._editingKey;
          session.state = 'confirm';
          nextChoices = ['Yes, deploy', 'Edit a setting', 'Change service'];
        } else {
          // AI extraction fallback
          const aiValue = await extractValueWithAI(param, message, subs, activeModel);
          if (aiValue !== null && !validationError(aiValue)) {
            session.collected[key] = aiValue;
            delete param._retryMsg;
            delete session._editingKey;
            session.state = 'confirm';
            nextChoices = ['Yes, deploy', 'Edit a setting', 'Change service'];
          } else {
            param._retryMsg = null;
            nextChoices = choicesForParam(param, subs, session);
          }
        }
      }
    }

  } else {
    // done state — allow starting over, keep subscription + re-detect env
    const keepSub = session.collected.__subscription;
    const autoEnv = inferEnv(keepSub?.name);
    session.state = 'start'; session.service = null; session.schema = []; session.schemaIdx = 0;
    session.collected = { ...(keepSub ? { __subscription: keepSub } : {}), ...(autoEnv ? { __env: autoEnv } : {}) };
    const svc = detectService(message);
    if (svc) {
      session.service = svc; session.schema = buildSchema(svc, session.collected); session.schemaIdx = 0; session.state = 'collecting';
      nextChoices = choicesForParam(currentParam(session), subs, session);
    } else {
      nextChoices = Object.values(SERVICE_LABELS);
    }
  }

  // ── Respond: collecting state → direct text, no LLM ─────────────────────
  // Only use Ollama for start (welcome/service picker) and confirm states
  const useDirectText = !useOllamaForRetry &&
    ((session.state === 'collecting' || session.state === 'confirm' || session.state === 'editing')
    || (session.state === 'start' && nextChoices?.length > 0 && !directive));

  if (useDirectText) {
    let text = '';
    // Prepend any skip notifications accumulated by currentParam()
    const skipPrefix = session._skipMsgs?.length ? session._skipMsgs.join('\n') + '\n\n' : '';
    session._skipMsgs = [];
    if (session.state === 'collecting') {
      const next = currentParam(session);
      text = skipPrefix + (next
        ? (next._retryMsg || next.q)
        : 'Something went wrong. Please refresh and try again.');
    } else if (session.state === 'confirm') {
      text = skipPrefix + `Here's a summary of what will be deployed:\n\n${makeSummary(session)}\n\nWould you like to deploy with these settings?`;
      nextChoices = ['Yes, deploy', 'Edit a setting', 'Change service'];
    } else if (session.state === 'editing') {
      if (!session._editingKey) {
        text = skipPrefix + 'Which setting would you like to change?';
      } else {
        const editParam = findParamByKey(session, session._editingKey);
        text = skipPrefix + (editParam ? (editParam._retryMsg || editParam.q) : 'Please enter the new value.');
      }
    } else {
      text = 'What would you like to deploy next?';
    }
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: text });
    sse(res, 'token', { content: text });
    if (nextChoices?.length) sse(res, 'choices', { choices: nextChoices });
    sse(res, 'done');
    return res.end();
  }

  // ── Call Ollama (only for start/done states — welcome & service picker) ────
  session.messages.push({ role: 'system', content: directive });
  session.messages.push({ role: 'user',   content: message });

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: activeModel, messages: session.messages, stream: true, options: { temperature: 0.3 } })
    });

    if (!ollamaRes.ok) {
      sse(res, 'error', { message: `Ollama returned ${ollamaRes.status}: ${await ollamaRes.text()}` });
      return res.end();
    }

    let fullContent = '';
    const reader  = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split('\n').filter(Boolean)) {
        try {
          const chunk = JSON.parse(line);
          if (chunk.message?.content) {
            fullContent += chunk.message.content;
            sse(res, 'token', { content: chunk.message.content });
          }
        } catch { /* partial line */ }
      }
    }

    session.messages.push({ role: 'assistant', content: fullContent });

    // Learn mode: append MS Learn link + action buttons after Ollama response
    if (session.state === 'learning' && !nextChoices?.length) {
      const docsLink = session._pendingLearnLink;
      session._pendingLearnLink = null;
      if (docsLink) sse(res, 'learn_link', { url: docsLink });
      const svcLabel = session._learnService ? (SERVICE_LABELS[session._learnService] || session._learnService) : null;
      nextChoices = svcLabel
        ? [`Deploy ${svcLabel} now`, 'Keep learning']
        : ['Keep learning'];
    }

    if (nextChoices?.length) sse(res, 'choices', { choices: nextChoices });
    sse(res, 'done');
  } catch (err) {
    sse(res, 'error', { message: `Chat error: ${err.message}` });
  }

  res.end();
});

/** Deploy — runs az CLI, streams logs via SSE */
app.post('/api/deploy', (req, res) => {
  const { config } = req.body;
  if (!config) return res.status(400).json({ error: 'config required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Guard: ensure user is logged in before deploying
  try {
    execSync('az account show --output none 2>nul', { timeout: 8000 });
  } catch {
    sse(res, 'error', { message: 'Not logged in to Azure. Please sign in via the top-right login button first.' });
    return res.end();
  }

  const SERVICE_BICEP_MAP = {
    'servicebus':           'servicebus.bicep',
    'eventhub':             'eventhub.bicep',
    'logicapp-consumption': 'logicapp-consumption.bicep',
    'logicapp-standard':    'logicapp-standard.bicep',
    'apim':                 'apim.bicep',
    'integrationaccount':   'integrationaccount.bicep',
    'functionapp':          'functionapp.bicep',
    'keyvault':             'keyvault.bicep',
    'eventgrid':            'eventgrid.bicep',
  };

  const bicepFileName = SERVICE_BICEP_MAP[config.service];
  if (!bicepFileName) {
    sse(res, 'error', { message: `Unknown service: ${config.service}` });
    return res.end();
  }

  const bicepFile = path.join(MODULES_DIR, bicepFileName);
  if (!fs.existsSync(bicepFile)) {
    sse(res, 'error', { message: `Bicep file not found: ${bicepFile}` });
    return res.end();
  }

  // Key Vault: auto-inject current user's object ID if not supplied
  if (config.service === 'keyvault' && !config.params.adminObjectId) {
    try {
      const objId = execSync('az ad signed-in-user show --query id -o tsv 2>nul', { timeout: 8000 }).toString().trim();
      if (objId) config.params.adminObjectId = objId;
    } catch { /* leave empty — vault deploys without access policy */ }
  }

  // Build ARM parameters JSON — coerce typed params (e.g. int)
  const svcSchema = SERVICE_SCHEMAS[config.service] || [];
  const allParams = { ...config.params, location: config.location, tags: config.tags };
  const armParams = {};
  for (const [k, v] of Object.entries(allParams)) {
    const def = svcSchema.find(p => p.key === k);
    armParams[k] = { value: def?.paramType === 'int' ? parseInt(v, 10) : v };
  }

  const tmpFile = path.join(os.tmpdir(), `il-deploy-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(armParams, null, 2));

  const cleanup = () => { try { fs.unlinkSync(tmpFile); } catch {} };

  const runStep = (label, args) => new Promise((resolve, reject) => {
    sse(res, 'log', { message: label });
    const proc = spawn('az', args, { shell: true });
    proc.stdout.on('data', d => sse(res, 'log', { message: d.toString().trimEnd() }));
    proc.stderr.on('data', d => {
      const m = d.toString().trimEnd();
      // Suppress noisy Bicep upgrade reminder
      if (m.includes('A new Bicep release is available')) return;
      sse(res, m.startsWith('WARNING:') ? 'warn' : 'log', { message: m });
    });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Step failed (exit ${code})`)));
  });

  const steps = [
    () => runStep(
      `[~] Setting subscription: ${config.subscriptionName || config.subscriptionId}`,
      ['account', 'set', '--subscription', config.subscriptionId]
    )
  ];

  if (config.createResourceGroup) {
    steps.push(() => runStep(
      `[+] Creating resource group: ${config.resourceGroup} in ${config.location}`,
      ['group', 'create', '--name', config.resourceGroup, '--location', config.location, '--output', 'none']
    ));
  }

  steps.push(() => runStep(
    `[>] Deploying ${config.serviceLabel} → ${config.resourceGroup} ...`,
    ['deployment', 'group', 'create',
      '--resource-group', config.resourceGroup,
      '--name', config.deploymentName,
      '--template-file', bicepFile,
      '--parameters', `@${tmpFile}`,
      '--output', 'table']
  ));

  // Fetch and surface Bicep deployment outputs
  const emitOutputs = () => {
    try {
      const raw = execSync(
        `az deployment group show --resource-group "${config.resourceGroup}" --name "${config.deploymentName}" --query properties.outputs -o json 2>nul`,
        { timeout: 15000 }
      ).toString().trim();
      const outputs = JSON.parse(raw);
      const keys = Object.keys(outputs);
      if (keys.length) {
        sse(res, 'log', { message: '[+] Deployment outputs:' });
        for (const k of keys) {
          sse(res, 'log', { message: `    ${k}: ${outputs[k].value}` });
        }
      }
    } catch { /* outputs unavailable — not fatal */ }
  };

  // Function App / Logic App Standard: zip-deploy local code after infrastructure is ready
  if (['functionapp', 'logicapp-standard'].includes(config.service) && config.codePath) {
    const zipFile    = path.join(os.tmpdir(), `il-code-${Date.now()}.zip`);
    const appName    = config.params.functionAppName || config.params.logicAppName;
    const deployCmd  = config.service === 'logicapp-standard' ? 'logicapp' : 'functionapp';
    steps.push(() => new Promise((resolve, reject) => {
      sse(res, 'log', { message: `[~] Packaging code from: ${config.codePath}` });
      const proc = spawn('powershell', [
        '-NoProfile', '-Command',
        `Compress-Archive -Path '${config.codePath}\\*' -DestinationPath '${zipFile}' -Force`
      ], { shell: false });
      proc.stderr.on('data', d => sse(res, 'log', { message: d.toString().trimEnd() }));
      proc.on('close', code => code === 0 ? resolve() : reject(new Error('Failed to zip code folder')));
    }));
    steps.push(() => runStep(
      `[>] Deploying code to ${appName} ...`,
      [deployCmd, 'deployment', 'source', 'config-zip',
        '--resource-group', config.resourceGroup,
        '--name', appName,
        '--src', zipFile]
    ));
    const cleanupAll = () => { cleanup(); try { fs.unlinkSync(zipFile); } catch {} };
    steps.reduce((p, fn) => p.then(fn), Promise.resolve())
      .then(() => { emitOutputs(); cleanupAll(); sse(res, 'success', { message: 'Deployment completed successfully.' }); res.end(); })
      .catch(err  => { cleanupAll(); sse(res, 'error',   { message: err.message });                        res.end(); });
    return;
  }

  steps.reduce((p, fn) => p.then(fn), Promise.resolve())
    .then(() => { emitOutputs(); cleanup(); sse(res, 'success', { message: 'Deployment completed successfully.' }); res.end(); })
    .catch(err  => { cleanup(); sse(res, 'error',   { message: err.message });                        res.end(); });
});

/** Clear a session */
app.delete('/api/session/:id', (req, res) => {
  sessions.delete(req.params.id);
  res.json({ ok: true });
});

/** Debug — list all active sessions and their chat history */
app.get('/api/debug/sessions', (_req, res) => {
  const out = {};
  for (const [id, s] of sessions.entries()) {
    out[id] = {
      state:     s.state,
      service:   s.service,
      collected: s.collected,
      history:   s.messages
        .filter(m => m.role !== 'system')   // hide system directives
        .map(m => ({ role: m.role, content: m.content.slice(0, 300) }))
    };
  }
  res.json(out);
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   DeploX Chatbot  v0.01                  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n  🌐  http://localhost:${PORT}`);
  console.log(`  🤖  Model : ${OLLAMA_MODEL}`);
  console.log(`  🔗  Ollama: ${OLLAMA_URL}\n`);
});
