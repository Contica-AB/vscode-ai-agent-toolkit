import fs from 'fs';
import path from 'path';
import { MODULES_DIR } from './config.js';

/** Load and cache Bicep templates for learn mode */
export function loadBicepContext() {
  const slim = {}, full = {};
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
      slim[svc] = raw.split('\n')
        .filter(l => /^\s*(param |resource |output |var )/.test(l) || /allowed\s*=/.test(l))
        .join('\n').trim();
      full[svc] = raw.trim();
    } catch { slim[svc] = full[svc] = '(template not found)'; }
  }
  return { slim, full };
}

const { slim: BICEP_TEMPLATES, full: BICEP_FULL } = loadBicepContext();
export { BICEP_TEMPLATES, BICEP_FULL };

/** Cached MS Learn content fetcher */
const learnContentCache = new Map();

export async function fetchLearnContent(url) {
  if (learnContentCache.has(url)) return learnContentCache.get(url);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const resp = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DeploX/1.0)' } });
    clearTimeout(timer);
    const html = await resp.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);
    learnContentCache.set(url, text);
    return text;
  } catch { return ''; }
}
