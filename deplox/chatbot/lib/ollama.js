import { OLLAMA_URL } from './config.js';
import { SERVICE_LABELS } from './schemas.js';

/** AI-powered service detection (fallback when keyword match fails) */
export async function detectServiceWithAI(message, model) {
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
  const list = Object.entries(descriptions).map(([k, v]) => `${k}: ${v}`).join('\n');
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

/** AI-powered value extraction (fallback when pattern matching fails) */
export async function extractValueWithAI(param, message, subs, model) {
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
