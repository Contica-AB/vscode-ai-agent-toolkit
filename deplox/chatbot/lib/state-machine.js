import { SERVICE_SCHEMAS, COMMON_SCHEMA, SERVICE_LABELS, SERVICE_KEYWORDS } from './schemas.js';
import { azJson } from './azure-cli.js';

/** Detect service from message by keyword matching */
export function detectService(msg) {
  const lower = msg.toLowerCase();
  for (const [svc, keywords] of Object.entries(SERVICE_KEYWORDS))
    if (keywords.some(k => lower.includes(k))) return svc;
  return null;
}

/** Extract a parameter value from user message based on schema type */
export function extractValue(param, msg, subs) {
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
    if (param.validate) {
      const err = param.validate(val);
      if (err) return { __invalid: true, reason: err };
    }
    return val;
  }
  return null;
}

/** Returns a validation error string, or null if valid */
export function validationError(extracted) {
  return (extracted && typeof extracted === 'object' && extracted.__invalid) ? extracted.reason : null;
}

/** Get current parameter, advancing past skipped ones */
export function currentParam(session) {
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

/** Build schema for a service, filtering out params already collected */
export function buildSchema(svc, collected) {
  return [...(SERVICE_SCHEMAS[svc] || []), ...COMMON_SCHEMA]
    .filter(p => !(p.key in collected))
    .map(p => ({ ...p }));
}

/** Infer environment tag from a subscription name */
export function inferEnv(subName = '') {
  const n = subName.toLowerCase();
  return n.includes('prod') ? 'prod'
       : n.includes('test') || n.includes('stag') ? 'test'
       : n.includes('dev')  ? 'dev'
       : null;
}

/** Build the LLM directive for the current parameter */
export function buildDirective(param, subs) {
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

/** Get the choice buttons for the current parameter */
export function choicesForParam(param, subs, session) {
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

/** Build the deployment config from collected session data */
export function buildDeployConfig(session) {
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
    subscriptionName:    subName,
    resourceGroup:       collected.__rgName || 'my-rg',
    createResourceGroup: true,
    location:            collected.__location || 'westeurope',
    deploymentName:      `${service}-${String(firstName).replace(/[^a-z0-9-]/gi,'-').slice(0,20)}`,
    params:              serviceParams,
    codePath:            collected.__codePath?.trim() || null,
    tags: { Environment: collected.__env || 'dev', CreatedBy: 'DeploX' }
  };
}

/** Build a human-readable summary of collected parameters */
export function makeSummary(session) {
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

/** Returns a short readable label from a camelCase param key */
export function paramLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

/** Returns edit-choice buttons for every schema param */
export function editableChoices(session) {
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

/** Find schema param by key */
export function findParamByKey(session, key) {
  return (session.schema || []).find(p => p.key === key);
}
